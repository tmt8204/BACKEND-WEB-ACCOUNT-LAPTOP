const Refund = require('../models/refund.model');

class RefundRepository {
    async createRefund(data, session = null) {
        try {
            const options = session ? { session } : {};
            const [refund] = await Refund.create([data], options);
            return refund;
        } catch (error) {
            throw error;
        }
    }

    async findRefundsByOrder(orderId) {
        try {
            return await Refund.find({ order_id: orderId }).sort({ createdAt: -1 });
        } catch (error) {
            throw error;
        }
    }

    async findRefundById(refundId) {
        try {
            return await Refund.findById(refundId)
                .populate('user_id', 'fullname email')
                .populate('processed_by', 'fullname email')
                .populate('order_id');
        } catch (error) {
            throw error;
        }
    }

    async getAllRefunds({ filters = {}, page = 1, limit = 10 }) {
        try {
            const query = {};
            if (filters.order_id) query.order_id = filters.order_id;
            if (filters.user_id) query.user_id = filters.user_id;

            const skip = (page - 1) * limit;
            const [refunds, total] = await Promise.all([
                Refund.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('user_id', 'fullname email')
                    .populate('processed_by', 'fullname'),
                Refund.countDocuments(query)
            ]);

            return { refunds, total, page, limit, totalPages: Math.ceil(total / limit) };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new RefundRepository();