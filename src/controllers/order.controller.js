const orderService = require('../services/order.service');
const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/api.response');

class OrderController {

    /**
     * POST /api/v1/order/create
     * Tạo order + tạo payment trong cùng một request.
     * Trả về order info + payment info (bank_info nếu bank_transfer).
     */
    async createOrder(req, res, next) {
        try {
            const userId = req.user.id;
            const { items, payment_method, shipping_address, note } = req.body;

            // 1. Tạo order (lock items)
            const order = await orderService.createOrder(userId, {
                items,
                payment_method,
                shipping_address,
                note
            });

            // 2. Tạo payment liên kết với order vừa tạo
            const paymentInfo = await paymentService.createPayment(order._id);

            return res.status(201).json(
                ApiResponse.success(201, 'Tạo đơn hàng thành công', {
                    order,
                    payment: paymentInfo
                })
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/order/:orderId
     */
    async getOrder(req, res, next) {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;

            const order = await orderService.getOrderById(orderId, userId);

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thông tin đơn hàng thành công', order)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/order/my-orders
     * Query params: page, limit, status
     */
    async getMyOrders(req, res, next) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, status } = req.query;

            const result = await orderService.getMyOrders(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách đơn hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/order/:orderId/cancel
     */
    async cancelOrder(req, res, next) {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            const { cancel_reason } = req.body;

            const result = await orderService.cancelOrder(orderId, userId, cancel_reason);

            return res.status(200).json(
                ApiResponse.success(200, 'Huỷ đơn hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();