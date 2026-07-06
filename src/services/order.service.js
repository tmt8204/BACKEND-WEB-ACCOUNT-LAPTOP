const mongoose = require('mongoose');
const orderRepository = require('../repositories/order.repository');
const cartRepository = require('../repositories/cart.repository');
const PhysicalProductItem = require('../models/physical-product-item.model');
const DigitalProductItem = require('../models/digital-product-item.model');

class OrderService {

    /**
     * Tạo order từ cart của user.
     * Flow:
     *   1. Lấy cart, kiểm tra không rỗng
     *   2. Fetch & validate từng item trong cart (còn available không)
     *   3. Lock item về 'reserved'
     *   4. Tạo Order document
     *   5. Clear cart
     * Payment sẽ được tạo riêng ở PaymentService sau khi order có _id.
     */
    async createOrder(userId, { payment_method, shipping_address, note }) {
        // ── 0. Kiểm tra phone của user ──────────────────────────────
        const user = await mongoose.model('User').findById(userId);
        if (!user) {
            const err = new Error('Người dùng không tồn tại');
            err.statusCode = 404;
            throw err;
        }
        if (!user.phone) {
            const err = new Error('Vui lòng cập nhật số điện thoại trước khi đặt hàng');
            err.statusCode = 400;
            throw err;
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // ── 1. Lấy cart & kiểm tra ──────────────────────────────
            const cart = await cartRepository.findCartByUserId(userId);

            if (!cart || cart.items.length === 0) {
                const err = new Error('Giỏ hàng trống, không thể tạo đơn hàng');
                err.statusCode = 400;
                throw err;
            }

            // ── 2. Fetch & validate từng item trong cart ─────────────
            const orderItems = [];
            let total_amount = 0;
            let hasPhysical = false;

            for (const cartItem of cart.items) {
                // CartItemSchema: item_type = 'physical' | 'digital'
                // item_id là ObjectId trỏ tới PhysicalProductItem hoặc DigitalProductItem
                const item_id   = cartItem.item_id;
                const item_type = cartItem.item_type;   // 'physical' | 'digital'
                let itemDoc, product;

                if (item_type === 'physical') {
                    itemDoc = await PhysicalProductItem.findById(item_id)
                        .session(session)
                        .populate({ path: 'physical_product_id', populate: { path: 'product_id' } });

                    if (!itemDoc) {
                        const err = new Error(`Sản phẩm vật lý (id: ${item_id}) không tồn tại`);
                        err.statusCode = 404;
                        throw err;
                    }
                    if (itemDoc.status !== 'available') {
                        const productName = itemDoc.physical_product_id?.product_id?.name || item_id;
                        const err = new Error(`Sản phẩm "${productName}" đã không còn hàng`);
                        err.statusCode = 400;
                        throw err;
                    }

                    product = itemDoc.physical_product_id?.product_id;

                    // Kiểm tra sản phẩm còn active không
                    if (!product || !product.is_active) {
                        const err = new Error(`Sản phẩm "${product?.name || item_id}" đã ngừng kinh doanh`);
                        err.statusCode = 400;
                        throw err;
                    }

                    hasPhysical = true;

                    orderItems.push({
                        item_id: itemDoc._id,
                        item_type_ref: 'PhysicalProductItem',
                        product_id: product._id,
                        product_name: product.name,
                        product_type: 'physical',
                        sale_price: itemDoc.sale_price   // luôn lấy giá thực tế từ item, không từ cart
                    });

                    //total_amount += itemDoc.sale_price;
                    total_amount += itemDoc.sale_price * cartItem.quantity;

                    // Lock item → reserved
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
                        const err = new Error(`Sản phẩm digital (id: ${item_id}) không tồn tại`);
                        err.statusCode = 404;
                        throw err;
                    }
                    if (itemDoc.status !== 'available') {
                        const productName = itemDoc.digital_product_id?.product_id?.name || item_id;
                        const err = new Error(`Sản phẩm "${productName}" đã không còn hàng`);
                        err.statusCode = 400;
                        throw err;
                    }

                    product = itemDoc.digital_product_id?.product_id;

                    if (!product || !product.is_active) {
                        const err = new Error(`Sản phẩm "${product?.name || item_id}" đã ngừng kinh doanh`);
                        err.statusCode = 400;
                        throw err;
                    }

                    orderItems.push({
                        item_id: itemDoc._id,
                        item_type_ref: 'DigitalProductItem',
                        product_id: product._id,
                        product_name: product.name,
                        product_type: 'digital',
                        sale_price: itemDoc.sale_price
                    });

                    total_amount += itemDoc.sale_price * cartItem.quantity;

                    // Lock item → reserved
                    await DigitalProductItem.findByIdAndUpdate(
                        item_id,
                        { status: 'reserved' },
                        { session }
                    );

                } else {
                    const err = new Error(`item_type không hợp lệ trong giỏ hàng: ${item_type}`);
                    err.statusCode = 400;
                    throw err;
                }
            }

            // ── 3. Validate shipping_address nếu có physical item ────
            if (hasPhysical && !shipping_address) {
                const err = new Error('Địa chỉ giao hàng là bắt buộc khi đặt sản phẩm vật lý');
                err.statusCode = 400;
                throw err;
            }

            // ── 4. Tạo Order ─────────────────────────────────────────
            const order = await orderRepository.createOrder({
                user_id: userId,
                items: orderItems,
                total_amount,
                shipping_address: hasPhysical ? shipping_address : null,
                payment_method,
                note: note || null,
                status: 'pending'
            }, session);

            // ── 5. Clear cart sau khi tạo order thành công ───────────
            await cartRepository.clearCart(userId, session);

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