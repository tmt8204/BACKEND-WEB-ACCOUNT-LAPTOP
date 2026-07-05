const staffService = require('../services/staff.service');
const ApiResponse = require('../utils/api.response');

class StaffController {

    // ── Dashboard ────────────────────────────────────────────── 
    
    async getDashboard(req, res, next) {
        try {
            const result = await staffService.getDashboard();
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy dashboard thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
    
    // ── Quản lý đơn hàng ────────────────────────────────────────

    async getAllOrders(req, res, next) {
        try {
            const { page, limit, status } = req.query;
            const result = await staffService.getAllOrders({ page, limit, status });
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách đơn hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // Xem chi tiết đơn hàng
    async getOrderDetail(req, res, next) {
        try {
            const { orderId } = req.params;
            const result = await staffService.getOrderDetail(orderId);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy chi tiết đơn hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // Cập nhật trạng thái đơn hàng
    async updateOrderStatus(req, res, next) {
        try {
        
            const { orderId } = req.params;
            const { status } = req.body;
            const result = await staffService.updateOrderStatus(orderId, status);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật trạng thái đơn hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // Thống kê số lượng đơn theo trạng thái
    async getOrderStatistics(req, res, next) {
        try {
            const result = await staffService.getOrderStatistics();
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thống kê đơn hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StaffController();