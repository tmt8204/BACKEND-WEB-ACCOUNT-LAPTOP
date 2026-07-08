// src/services/refund.service.js
const mongoose = require('mongoose');
const orderRepository = require('../repositories/order.repository');
const paymentRepository = require('../repositories/payment.repository');
const refundRepository = require('../repositories/refund.repository');
const inventoryRepository = require('../repositories/inventory.repository');
const supportTicketRepo = require('../repositories/support-ticket.repository');

const PhysicalProductItem = require('../models/physical-product-item.model');
const DigitalProductItem = require('../models/digital-product-item.model');
const Order = require('../models/order.model');

// Đơn phải ở trạng thái này mới được hoàn (đã thanh toán / đã giao)
const REFUNDABLE_ORDER_STATUSES = ['confirmed', 'processing', 'completed'];

class RefundService {

    /**
     * Hoàn tiền cho 1 đơn hàng — toàn bộ hoặc theo danh sách order_item_id.
     * Tự động:
     *  - Đổi trạng thái item: physical -> 'returned' (chờ QC), digital -> 'expired'
     *  - Cập nhật order item (is_refunded) và order.status
     *  - Cập nhật payment.status / refund_amount
     *  - Ghi InventoryLog (action: refund_in)
     *  - Tạo bản ghi Refund để đối soát
     *  - (tùy chọn) tự động resolve support ticket refund_request liên quan
     */
    async processRefund(orderId, staffId, { order_item_ids, reason, refund_method, restock_physical = false, ticket_id } = {}) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // ── 1. Validate order ─────────────────────────────
            const order = await Order.findById(orderId).session(session);
            if (!order) {
                const err = new Error('Đơn hàng không tồn tại');
                err.statusCode = 404;
                throw err;
            }

            if (!REFUNDABLE_ORDER_STATUSES.includes(order.status)) {
                const err = new Error(`Đơn hàng ở trạng thái "${order.status}" không thể hoàn tiền`);
                err.statusCode = 400;
                throw err;
            }

            const payment = await paymentRepository.findPaymentByOrderId(orderId);
            if (!payment || payment.status !== 'paid') {
                const err = new Error('Đơn hàng chưa thanh toán hoặc đã được hoàn tiền trước đó');
                err.statusCode = 400;
                throw err;
            }

            // ── 2. Xác định danh sách item cần hoàn ───────────
            let targetItems;
            if (order_item_ids && order_item_ids.length > 0) {
                targetItems = order.items.filter(i =>
                    order_item_ids.includes(i._id.toString())
                );
                if (targetItems.length !== order_item_ids.length) {
                    const err = new Error('Một số order_item_id không thuộc đơn hàng này');
                    err.statusCode = 400;
                    throw err;
                }
            } else {
                targetItems = order.items; // hoàn toàn bộ
            }

            const alreadyRefunded = targetItems.filter(i => i.is_refunded);
            if (alreadyRefunded.length > 0) {
                const err = new Error('Một số sản phẩm trong yêu cầu đã được hoàn tiền trước đó');
                err.statusCode = 400;
                throw err;
            }

            // ── 3. Xử lý từng item: đổi trạng thái tồn kho ────
            const refundItemsLog = [];
            let totalRefundAmount = 0;

            for (const orderItem of targetItems) {
                let newStatus;
                let restocked = false;

                if (orderItem.item_type_ref === 'PhysicalProductItem') {
                    // Vật lý: mặc định trả về 'returned' để staff kiểm tra (QC)
                    // Nếu staff xác nhận hàng còn nguyên (restock_physical=true) -> available luôn
                    newStatus = restock_physical ? 'available' : 'returned';
                    restocked = restock_physical;

                    await PhysicalProductItem.findByIdAndUpdate(
                        orderItem.item_id,
                        { status: newStatus },
                        { session }
                    );

                } else if (orderItem.item_type_ref === 'DigitalProductItem') {
                    // Digital: tài khoản đã giao cho khách -> không tái sử dụng được
                    newStatus = 'expired';
                    restocked = false;

                    await DigitalProductItem.findByIdAndUpdate(
                        orderItem.item_id,
                        { status: newStatus },
                        { session }
                    );
                } else {
                    const err = new Error(`item_type_ref không hợp lệ: ${orderItem.item_type_ref}`);
                    err.statusCode = 400;
                    throw err;
                }

                // Ghi log kho
                await inventoryRepository.createLog(
                    {
                        product_id: orderItem.product_id,
                        item_id: orderItem.item_id,
                        item_type_ref: orderItem.item_type_ref,
                        product_type: orderItem.product_type,
                        action: 'refund_in',
                        status_before: 'sold',
                        status_after: newStatus,
                        note: `Hoàn hàng theo đơn ${order._id}`,
                        created_by: staffId
                    },
                    session
                );

                // Đánh dấu item trong order đã refund
                orderItem.is_refunded = true;
                orderItem.refunded_at = new Date();
                orderItem.refund_amount = orderItem.sale_price;

                totalRefundAmount += orderItem.sale_price;

                refundItemsLog.push({
                    order_item_id: orderItem._id,
                    item_id: orderItem.item_id,
                    item_type_ref: orderItem.item_type_ref,
                    product_id: orderItem.product_id,
                    product_name: orderItem.product_name,
                    product_type: orderItem.product_type,
                    refund_amount: orderItem.sale_price,
                    restocked,
                    item_status_after: newStatus
                });
            }

            // ── 4. Cập nhật trạng thái order ──────────────────
            const allRefunded = order.items.every(i => i.is_refunded);
            order.status = allRefunded ? 'refunded' : 'partially_refunded';
            await order.save({ session });

            // ── 5. Cập nhật payment ────────────────────────────
            const newPaymentRefundAmount = (payment.refund_amount || 0) + totalRefundAmount;
            await paymentRepository.updatePayment(
                payment._id,
                {
                    status: allRefunded ? 'refunded' : 'paid', // paid nếu mới hoàn 1 phần
                    refund_amount: newPaymentRefundAmount,
                    refunded_at: new Date(),
                    refund_reason: reason
                },
                session
            );

            // ── 6. Tạo bản ghi Refund (audit) ─────────────────
            const refund = await refundRepository.createRefund(
                {
                    order_id: order._id,
                    payment_id: payment._id,
                    user_id: order.user_id,
                    ticket_id: ticket_id || null,
                    items: refundItemsLog,
                    total_refund_amount: totalRefundAmount,
                    is_full_refund: allRefunded,
                    reason,
                    refund_method: refund_method || 'original_payment',
                    status: 'completed',
                    processed_by: staffId
                },
                session
            );

            // ── 7. Nếu hoàn tiền được tạo từ 1 ticket -> tự resolve ticket ──
            if (ticket_id) {
                await supportTicketRepo.updateTicket(ticket_id, {
                    status: 'resolved',
                    resolution_note: `Đã hoàn tiền ${totalRefundAmount.toLocaleString('vi-VN')}đ - Refund ID: ${refund._id}`,
                    resolved_at: new Date()
                });
            }

            await session.commitTransaction();

            return {
                refund,
                order_status: order.status,
                payment_status: allRefunded ? 'refunded' : 'paid',
                total_refund_amount: totalRefundAmount
            };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getRefundsByOrder(orderId) {
        try {
            return await refundRepository.findRefundsByOrder(orderId);
        } catch (error) {
            throw error;
        }
    }

    async getRefundDetail(refundId) {
        try {
            const refund = await refundRepository.findRefundById(refundId);
            if (!refund) {
                const err = new Error('Không tìm thấy yêu cầu hoàn tiền');
                err.statusCode = 404;
                throw err;
            }
            return refund;
        } catch (error) {
            throw error;
        }
    }

    async getAllRefunds({ order_id, user_id, page, limit }) {
        try {
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, parseInt(limit) || 10);
            return await refundRepository.getAllRefunds({
                filters: { order_id, user_id },
                page: pageNum,
                limit: limitNum
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new RefundService();