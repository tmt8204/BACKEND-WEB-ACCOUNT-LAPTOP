const mongoose = require('mongoose');
const orderRepository = require('../repositories/order.repository');
const PhysicalProductItem = require('../models/physical-product-item.model');
const DigitalProductItem = require('../models/digital-product-item.model');
const Product = require('../models/product.model');

class OrderService {

    /**
     * Tạo order mới.
     * items: [{ item_id, item_type: 'physical'|'digital' }]
     * Hàm sẽ:
     *   1. Fetch & validate từng item (còn available không)
     *   2. Lock item về 'reserved'
     *   3. Tạo Order document
     * Payment sẽ được tạo riêng ở PaymentService sau khi order có _id.
     */
    async createOrder(userId, { items, payment_method, shipping_address, note }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // ── 1. Fetch & validate items ──────────────────────────────
            const orderItems = [];
            let total_amount = 0;
            let hasPhysical = false;

            for (const { item_id, item_type } of items) {
                let itemDoc, product;

                if (item_type === 'physical') {
                    itemDoc = await PhysicalProductItem.findById(item_id)
                        .session(session)
                        .populate({ path: 'physical_product_id', populate: { path: 'product_id' } });

                    if (!itemDoc) {
                        const err = new Error(`Sản phẩm vật lý ${item_id} không tồn tại`);
                        err.statusCode = 404;
                        throw err;
                    }
                    if (itemDoc.status !== 'available') {
                        const err = new Error(`Sản phẩm "${itemDoc.physical_product_id?.product_id?.name}" đã không còn hàng`);
                        err.statusCode = 400;
                        throw err;
                    }

                    product = itemDoc.physical_product_id?.product_id;
                    hasPhysical = true;

                    orderItems.push({
                        item_id: itemDoc._id,
                        item_type_ref: 'PhysicalProductItem',
                        product_id: product._id,
                        product_name: product.name,
                        product_type: 'physical',
                        sale_price: itemDoc.sale_price
                    });

                    total_amount += itemDoc.sale_price;

                    // Lock item
                    await PhysicalProductItem.findByIdAndUpdate(
                        item_id,
                        { status: 'reserved' },
                        { session }
                    );

                } else if (item_type === 'digital') {
                    itemDoc = await DigitalProductItem.findById(item_id)
                        .session(session)
                        .populate({ path: 'digital_product_id', populate: { path: 'product_id' } });

                    if (!itemDoc) {
                        const err = new Error(`Sản phẩm digital ${item_id} không tồn tại`);
                        err.statusCode = 404;
                        throw err;
                    }
                    if (itemDoc.status !== 'available') {
                        const err = new Error(`Sản phẩm "${itemDoc.digital_product_id?.product_id?.name}" đã không còn hàng`);
                        err.statusCode = 400;
                        throw err;
                    }

                    product = itemDoc.digital_product_id?.product_id;

                    orderItems.push({
                        item_id: itemDoc._id,
                        item_type_ref: 'DigitalProductItem',
                        product_id: product._id,
                        product_name: product.name,
                        product_type: 'digital',
                        sale_price: itemDoc.sale_price
                    });

                    total_amount += itemDoc.sale_price;

                    // Lock item
                    await DigitalProductItem.findByIdAndUpdate(
                        item_id,
                        { status: 'reserved' },
                        { session }
                    );

                } else {
                    const err = new Error(`item_type không hợp lệ: ${item_type}`);
                    err.statusCode = 400;
                    throw err;
                }
            }

            // ── 2. Validate shipping_address nếu có physical item ─────
            if (hasPhysical && !shipping_address) {
                const err = new Error('Địa chỉ giao hàng là bắt buộc khi đặt sản phẩm vật lý');
                err.statusCode = 400;
                throw err;
            }

            // ── 3. Tạo Order ──────────────────────────────────────────
            const order = await orderRepository.createOrder({
                user_id: userId,
                items: orderItems,
                total_amount,
                shipping_address: hasPhysical ? shipping_address : null,
                payment_method,
                note: note || null,
                status: 'pending'
            }, session);

            await session.commitTransaction();
            return order;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getOrderById(orderId, userId = null) {
        try {
            const order = await orderRepository.findOrderById(orderId);
            if (!order) {
                const err = new Error('Đơn hàng không tồn tại');
                err.statusCode = 404;
                throw err;
            }
            // Nếu truyền userId thì chỉ được xem order của mình
            if (userId && order.user_id._id.toString() !== userId.toString()) {
                const err = new Error('Bạn không có quyền xem đơn hàng này');
                err.statusCode = 403;
                throw err;
            }
            return order;
        } catch (error) {
            throw error;
        }
    }

    async getMyOrders(userId, query = {}) {
        try {
            return await orderRepository.findOrdersByUser(userId, query);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Huỷ order — chỉ được huỷ khi status = 'pending'
     * Sẽ giải phóng lại item về 'available'
     */
    async cancelOrder(orderId, userId, cancel_reason) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await orderRepository.findOrderById(orderId);

            if (!order) {
                const err = new Error('Đơn hàng không tồn tại');
                err.statusCode = 404;
                throw err;
            }
            if (order.user_id._id.toString() !== userId.toString()) {
                const err = new Error('Bạn không có quyền huỷ đơn hàng này');
                err.statusCode = 403;
                throw err;
            }
            if (order.status !== 'pending') {
                const err = new Error('Chỉ có thể huỷ đơn hàng đang ở trạng thái chờ thanh toán');
                err.statusCode = 400;
                throw err;
            }

            // Giải phóng item về 'available'
            await this._releaseItems(order.items, session);

            // Cập nhật order
            await orderRepository.updateOrderStatus(
                orderId,
                'cancelled',
                { cancel_reason: cancel_reason || 'Khách huỷ đơn', cancelled_at: new Date() },
                session
            );

            await session.commitTransaction();
            return { message: 'Huỷ đơn hàng thành công' };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // ── Internal helper ────────────────────────────────────────────────
    async _releaseItems(items, session = null) {
        for (const item of items) {
            const options = session ? { session } : {};
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

module.exports = new OrderService();