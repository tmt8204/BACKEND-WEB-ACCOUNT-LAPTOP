const refundService = require('../services/refund.service');
const ApiResponse = require('../utils/api.response');

class RefundController {

    // POST /api/v1/refund/orders/:orderId
    async processRefund(req, res, next) {
        try {
            const staffId = req.user.id;
            const { orderId } = req.params;

            const result = await refundService.processRefund(orderId, staffId, req.body);

            return res.status(200).json(
                ApiResponse.success(200, 'Hoàn tiền thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/refund/orders/:orderId
    async getRefundsByOrder(req, res, next) {
        try {
            const { orderId } = req.params;
            const result = await refundService.getRefundsByOrder(orderId);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy lịch sử hoàn tiền thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/refund/:refundId
    async getRefundDetail(req, res, next) {
        try {
            const { refundId } = req.params;
            const result = await refundService.getRefundDetail(refundId);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy chi tiết hoàn tiền thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/refund
    async getAllRefunds(req, res, next) {
        try {
            const { order_id, user_id, page, limit } = req.query;
            const result = await refundService.getAllRefunds({ order_id, user_id, page, limit });
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách hoàn tiền thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RefundController();