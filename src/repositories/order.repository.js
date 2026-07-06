const Order = require('../models/order.model');

class OrderRepository {
    async createOrder(orderData, session = null) {

        try {
            const options = session ? { session } : {};
            const [order] = await Order.create([orderData], options);
            return order;
        } catch (error) {
            throw error;
        }
    }

    async findOrderById(orderId) {
        try {
            return await Order.findById(orderId)
                .populate('user_id', 'fullname email phone')
                .populate('payment_id');
        } catch (error) {
            throw error;
        }
    }

    async findOrdersByUser(userId, { page = 1, limit = 10, status } = {}) {
        try {
            const filter = { user_id: userId };
            if (status) filter.status = status;

            const skip = (page - 1) * limit;
            const [orders, total] = await Promise.all([
                Order.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('payment_id', 'method status paid_at transfer_content'),
                Order.countDocuments(filter)
            ]);

            return { orders, total, page, limit };
        } catch (error) {
            throw error;
        }
    }

    async updateOrderStatus(orderId, status, extra = {}, session = null) {
        try {
            const options = session ? { new: true, session } : { new: true };
            return await Order.findByIdAndUpdate(
                orderId,
                { status, ...extra },
                options
            );
        } catch (error) {
            throw error;
        }
    }

    async updateOrderPaymentId(orderId, paymentId, session = null) {
        try {
            const options = session ? { new: true, session } : { new: true };
            return await Order.findByIdAndUpdate(
                orderId,
                { payment_id: paymentId },
                options
            );
        } catch (error) {
            throw error;
        }
    }

    // Tìm tất cả order pending đã quá hạn (dùng cho cron job)
    async findExpiredPendingOrders(before) {
        try {
            return await Order.find({
                status: 'pending',
                payment_method: 'bank_transfer',
                createdAt: { $lt: before }
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new OrderRepository();