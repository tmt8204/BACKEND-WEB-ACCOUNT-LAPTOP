const mongoose = require('mongoose');
const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const PhysicalProductItem = require('../models/physical-product-item.model');
const DigitalProductItem = require('../models/digital-product-item.model');

// Thời gian hết hạn thanh toán chuyển khoản: 30 phút
const BANK_TRANSFER_EXPIRE_MINUTES = 30;

class PaymentService {

    /**
     * Tạo Payment sau khi Order đã được tạo.
     * Với bank_transfer: sinh transfer_content unique và trả về thông tin CK.
     * Với COD: payment status = 'pending', chờ staff confirm.
     */
    async createPayment(orderId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await orderRepository.findOrderById(orderId);
            if (!order) {
                const err = new Error('Đơn hàng không tồn tại');
                err.statusCode = 404;
                throw err;
            }
            if (order.payment_id) {
                const err = new Error('Đơn hàng đã có thông tin thanh toán');
                err.statusCode = 400;
                throw err;
            }
            if (order.status !== 'pending') {
                const err = new Error('Đơn hàng không ở trạng thái chờ thanh toán');
                err.statusCode = 400;
                throw err;
            }

            let paymentData = {
                order_id: order._id,
                method: order.payment_method,
                amount: order.total_amount
            };

            if (order.payment_method === 'bank_transfer') {
                // Sinh transfer_content unique: "DH" + timestamp + 4 ký tự random
                const transferContent = this._generateTransferContent(order._id);
                const expiresAt = new Date(Date.now() + BANK_TRANSFER_EXPIRE_MINUTES * 60 * 1000);

                paymentData = {
                    ...paymentData,
                    transfer_content: transferContent,
                    bank_account_number: process.env.BANK_ACCOUNT_NUMBER,
                    bank_account_name: process.env.BANK_ACCOUNT_NAME,
                    bank_name: process.env.BANK_NAME,
                    expires_at: expiresAt,
                    status: 'pending'
                };

            } else if (order.payment_method === 'cod') {
                paymentData = {
                    ...paymentData,
                    status: 'pending'
                };
            }

            // Tạo payment
            const payment = await paymentRepository.createPayment(paymentData, session);

            // Gắn payment_id vào order
            await orderRepository.updateOrderPaymentId(orderId, payment._id, session);

            await session.commitTransaction();

            return this._formatPaymentResponse(payment, order.payment_method);

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * SePay Webhook Handler.
     * SePay POST về endpoint này khi phát hiện giao dịch khớp.
     * Docs: https://sepay.vn/lap-trinh-webhook.html
     *
     * Body từ SePay:
     * {
     *   id: "...",
     *   gateway: "...",
     *   transactionDate: "...",
     *   accountNumber: "...",
     *   code: "DH...",          ← transfer_content
     *   content: "...",
     *   transferType: "in",
     *   transferAmount: 500000,
     *   accumulated: ...,
     *   referenceCode: "...",
     *   description: "...",
     * }
     */
    async handleSePayWebhook(webhookData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const {
                id: sepayTransactionId,
                code: transferContent,
                transferAmount,
                transferType,
                referenceCode
            } = webhookData;

            // Chỉ xử lý giao dịch tiền vào
            if (transferType !== 'in') {
                return { success: true, message: 'Bỏ qua giao dịch tiền ra' };
            }

            console.log("transferContent:", transferContent);

            // Tìm payment theo transfer_content
            const payment = await paymentRepository.findPaymentByTransferContent(transferContent);


            console.log("payment:", payment);

            if (!payment) {
                // Không tìm thấy — có thể là giao dịch khác, trả 200 để SePay không retry
                return { success: true, message: 'Không tìm thấy đơn hàng khớp với nội dung CK' };
            }

            // Đã xử lý rồi thì bỏ qua (idempotent)
            if (payment.status === 'paid') {
                return { success: true, message: 'Giao dịch đã được xử lý trước đó' };
            }

            // Kiểm tra số tiền
            if (transferAmount < payment.amount) {
                // Thiếu tiền — có thể log lại, không mark paid
                const err = new Error(`Số tiền chuyển khoản (${transferAmount}) nhỏ hơn số tiền đơn hàng (${payment.amount})`);
                err.statusCode = 400;
                throw err;
            }

            // Kiểm tra hết hạn
            if (payment.expires_at && new Date() > payment.expires_at) {
                await this._expirePaymentAndOrder(payment, session);
                await session.commitTransaction();
                return { success: false, message: 'Đơn hàng đã hết hạn thanh toán' };
            }

            const now = new Date();

            // Cập nhật payment → paid
            await paymentRepository.updatePayment(
                payment._id,
                {
                    status: 'paid',
                    sepay_transaction_id: sepayTransactionId,
                    sepay_reference_code: referenceCode,
                    paid_at: now
                },
                session
            );

            // Cập nhật order → confirmed
            await orderRepository.updateOrderStatus(payment.order_id, 'confirmed', {}, session);

            // Đổi item reserved → sold
            const order = await orderRepository.findOrderById(payment.order_id);
            await this._markItemsSold(order.items, session);

            await session.commitTransaction();

            return { success: true, message: 'Xác nhận thanh toán thành công' };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Staff xác nhận đã nhận tiền COD khi giao hàng thành công.
     */
    async confirmCOD(orderId, staffId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await orderRepository.findOrderById(orderId);

            if (!order) {
                const err = new Error('Đơn hàng không tồn tại');
                err.statusCode = 404;
                throw err;
            }
            if (order.payment_method !== 'cod') {
                const err = new Error('Đơn hàng này không phải COD');
                err.statusCode = 400;
                throw err;
            }
            if (!['pending', 'processing'].includes(order.status)) {
                const err = new Error('Đơn hàng không ở trạng thái hợp lệ để xác nhận COD');
                err.statusCode = 400;
                throw err;
            }

            const now = new Date();

            // Cập nhật payment
            const payment = await paymentRepository.findPaymentByOrderId(orderId);
            if (payment) {
                await paymentRepository.updatePayment(
                    payment._id,
                    {
                        status: 'paid',
                        cod_confirmed_by: staffId,
                        cod_confirmed_at: now,
                        paid_at: now
                    },
                    session
                );
            }

            // Cập nhật order → completed
            await orderRepository.updateOrderStatus(orderId, 'completed', {}, session);

            // Đổi item → sold
            await this._markItemsSold(order.items, session);

            await session.commitTransaction();

            return { message: 'Xác nhận COD thành công' };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Lấy thông tin thanh toán của một order.
     */
    async getPaymentByOrder(orderId, userId = null) {
        try {
            const order = await orderRepository.findOrderById(orderId);
            if (!order) {
                const err = new Error('Đơn hàng không tồn tại');
                err.statusCode = 404;
                throw err;
            }
            if (userId && order.user_id._id.toString() !== userId.toString()) {
                const err = new Error('Bạn không có quyền xem thông tin thanh toán này');
                err.statusCode = 403;
                throw err;
            }

            const payment = await paymentRepository.findPaymentByOrderId(orderId);
            if (!payment) {
                const err = new Error('Chưa có thông tin thanh toán cho đơn hàng này');
                err.statusCode = 404;
                throw err;
            }

            return this._formatPaymentResponse(payment, payment.method);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Expire các payment + order quá hạn (gọi từ cron job).
     */
    async expireStalePayments() {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const expiredPayments = await paymentRepository.findExpiredPendingPayments();
            let count = 0;

            for (const payment of expiredPayments) {
                await this._expirePaymentAndOrder(payment, session);
                count++;
            }

            await session.commitTransaction();
            return { expired: count };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // ── Internal helpers ───────────────────────────────────────────────

    _generateTransferContent(orderId) {
        const suffix = orderId.toString().slice(-6).toUpperCase();
        const ts = Date.now().toString().slice(-4);
        return `DH${suffix}${ts}`;
    }

    _formatPaymentResponse(payment, method) {
        const base = {
            payment_id: payment._id,
            order_id: payment.order_id,
            method: payment.method,
            amount: payment.amount,
            status: payment.status,
            created_at: payment.createdAt
        };

        if (method === 'bank_transfer') {
            return {
                ...base,
                bank_info: {
                    bank_name: payment.bank_name,
                    account_number: payment.bank_account_number,
                    account_name: payment.bank_account_name,
                    amount: payment.amount,
                    transfer_content: payment.transfer_content,
                    expires_at: payment.expires_at
                },
                paid_at: payment.paid_at,
                sepay_transaction_id: payment.sepay_transaction_id
            };
        }

        if (method === 'cod') {
            return {
                ...base,
                cod_confirmed_by: payment.cod_confirmed_by,
                cod_confirmed_at: payment.cod_confirmed_at
            };
        }

        return base;
    }

    async _expirePaymentAndOrder(payment, session) {
        await paymentRepository.updatePayment(
            payment._id,
            { status: 'failed' },
            session
        );
        const order = await orderRepository.findOrderById(payment.order_id);
        if (order && order.status === 'pending') {
            await orderRepository.updateOrderStatus(
                payment.order_id,
                'failed',
                { cancel_reason: 'Hết hạn thanh toán' },
                session
            );
            // Giải phóng item
            await this._releaseItems(order.items, session);
        }
    }

    async _markItemsSold(items, session = null) {
        const options = session ? { session } : {};
        for (const item of items) {
            if (item.item_type_ref === 'PhysicalProductItem') {
                await PhysicalProductItem.findByIdAndUpdate(
                    item.item_id,
                    { status: 'sold' },
                    options
                );
            } else if (item.item_type_ref === 'DigitalProductItem') {
                await DigitalProductItem.findByIdAndUpdate(
                    item.item_id,
                    { status: 'sold' },
                    options
                );
            }
        }
    }

    async _releaseItems(items, session = null) {
        const options = session ? { session } : {};
        for (const item of items) {
            if (item.item_type_ref === 'PhysicalProductItem') {
                await PhysicalProductItem.findByIdAndUpdate(
                    item.item_id,
                    { status: 'available' },
                    options
                );
            } else if (item.item_type_ref === 'DigitalProductItem') {
                await DigitalProductItem.findByIdAndUpdate(
                    item.item_id,
                    { status: 'available' },
                    options
                );
            }
        }
    }
}

module.exports = new PaymentService();