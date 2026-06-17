const SupportTicket = require('../models/support-ticket.model');

class SupportTicketRepository {

    async createTicket(data) {
        const ticket = new SupportTicket(data);
        return await ticket.save();
    }

    async findTicketById(ticketId) {
        return await SupportTicket.findById(ticketId)
            .populate('user_id', 'fullname email phone')
            .populate('assigned_to', 'fullname email')
            .populate('order_id', 'total_amount status createdAt');
    }

    async findTicketsByUser(userId, { page = 1, limit = 10, status, type } = {}) {
        const filter = { user_id: userId };
        if (status) filter.status = status;
        if (type) filter.type = type;

        const skip = (page - 1) * limit;
        const [tickets, total] = await Promise.all([
            SupportTicket.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('assigned_to', 'fullname'),
            SupportTicket.countDocuments(filter)
        ]);

        return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findAllTickets({ page = 1, limit = 10, status, type, priority, assigned_to, unassigned, search } = {}) {
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (priority) filter.priority = priority;
        if (assigned_to) filter.assigned_to = assigned_to;
        if (unassigned === true) filter.assigned_to = null;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { ticket_code: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const [tickets, total] = await Promise.all([
            SupportTicket.find(filter)
                .sort({ priority: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user_id', 'fullname email')
                .populate('assigned_to', 'fullname'),
            SupportTicket.countDocuments(filter)
        ]);

        return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Kiểm tra item đã có ticket active chưa
    async findActiveTicketByOrderItem(order_item_id) {
        return await SupportTicket.findOne({
            order_item_id,
            status: { $nin: ['closed', 'cancelled'] }
        });
    }

    async updateTicket(ticketId, updateData) {
        return await SupportTicket.findByIdAndUpdate(
            ticketId,
            updateData,
            { new: true }
        ).populate('user_id', 'fullname email')
         .populate('assigned_to', 'fullname email');
    }

    async getStats() {
        const [byStatus, byType, resolutionData, ratingData] = await Promise.all([
            SupportTicket.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            SupportTicket.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            SupportTicket.aggregate([
                { $match: { resolved_at: { $ne: null } } },
                {
                    $project: {
                        hours: {
                            $divide: [
                                { $subtract: ['$resolved_at', '$createdAt'] },
                                1000 * 60 * 60
                            ]
                        }
                    }
                },
                { $group: { _id: null, avg_hours: { $avg: '$hours' } } }
            ]),
            SupportTicket.aggregate([
                { $match: { rating: { $ne: null } } },
                { $group: { _id: null, avg_rating: { $avg: '$rating' } } }
            ])
        ]);

        const statusMap = {};
        byStatus.forEach(s => { statusMap[s._id] = s.count; });

        const typeMap = {};
        byType.forEach(t => { typeMap[t._id] = t.count; });

        const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

        return {
            total,
            by_status: statusMap,
            by_type: typeMap,
            avg_resolution_hours: resolutionData[0]
                ? Math.round(resolutionData[0].avg_hours * 10) / 10
                : null,
            avg_rating: ratingData[0]
                ? Math.round(ratingData[0].avg_rating * 10) / 10
                : null
        };
    }

    // Lấy ticket resolved quá 7 ngày để auto-close (dùng cho cron job)
    async findStaleResolvedTickets() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return await SupportTicket.find({
            status: 'resolved',
            resolved_at: { $lt: sevenDaysAgo }
        });
    }
}

module.exports = new SupportTicketRepository();