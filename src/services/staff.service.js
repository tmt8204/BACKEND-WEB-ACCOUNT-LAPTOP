const Order = require('../models/order.model');
const notificationService = require('./notification.service');

class StaffService {

    // Dashboard
    async getDashboard() {

        const [
                totalOrders,
                pendingOrders,
                confirmedOrders,
                processingOrders,
                completedOrders,
                cancelledOrders,
                failedOrders
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'confirmed' }),
            Order.countDocuments({ status: 'processing' }),
            Order.countDocuments({ status: 'completed' }),
            Order.countDocuments({ status: 'cancelled' }),
            Order.countDocuments({ status: 'failed' })
        ]);

        return {
            total_orders: totalOrders,
            pending_orders: pendingOrders,
            confirmed_orders: confirmedOrders,
            processing_orders: processingOrders,
            completed_orders: completedOrders,
            cancelled_orders: cancelledOrders,
            failed_orders: failedOrders
            
        };
    }

    // Danh sách đơn hàng
    async getAllOrders({ page = 1, limit = 10, status }) {

        const query = {};

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('user_id', 'fullname phone email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Order.countDocuments(query)
        ]);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    // Chi tiết đơn
    async getOrderDetail(orderId) {

        const order = await Order.findById(orderId)
            .populate('user_id', 'fullname phone email')
            .populate('items.product_id');

        if (!order) {
            throw new Error('Đơn hàng không tìm thấy!');
        }

        return order;
    }

    // Cập nhật trạng thái
    async updateOrderStatus(orderId, status) {

        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Đơn hàng không tìm thấy!');
        }

        // Lưu lại trạng thái CŨ trước khi ghi đè
        const oldStatus = order.status;

        order.status = status;
        await order.save();

        // Gửi thông báo
        if (oldStatus !== status) {
            const statusLabels = {
                pending: 'Chờ xử lý',
                confirmed: 'Đã xác nhận',  
                processing: 'Đang xử lý',
                completed: 'Hoàn thành',
                cancelled: 'Đã huỷ',
                failed: 'Thất bại'
            };

            await notificationService.notifyUser(order.user_id, {
                type: 'order_status_changed',
                title: 'Trạng thái đơn hàng đã được cập nhật',
                message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã được cập nhật trạng thái từ "${statusLabels[oldStatus]}" sang "${statusLabels[status]}"`,
                data: { order_id: order._id },
                link: `/orders/${order._id}`
            });
        }

        return order;
    }

    // Thống kê
    async getOrderStatistics() {

        return await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    total: {
                        $sum: 1
                    }
                }
            }
        ]);
    }

}

module.exports = new StaffService();