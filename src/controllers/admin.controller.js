const adminService = require('../services/admin.service');
const ApiResponse = require('../utils/api.response');

class AdminController {

    // ── Dashboard ──────────────────────────────────────────────

    async getDashboard(req, res, next) {
        try {
            const result = await adminService.getDashboard();
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy dashboard thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ── Báo cáo ────────────────────────────────────────────────

    async getReport(req, res, next) {
        try {
            const { from, to, type } = req.query;
            const result = await adminService.getReport({ from, to, type });
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy báo cáo thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ── Quản lí nhân viên ──────────────────────────────────────

    async getAllStaff(req, res, next) {
        try {
            const { page, limit, search } = req.query;
            const result = await adminService.getAllStaff({ page, limit, search });
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách nhân viên thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async createStaff(req, res, next) {
        try {
            const result = await adminService.createStaff(req.body);
            return res.status(201).json(
                ApiResponse.success(201, 'Tạo tài khoản nhân viên thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async updateStaff(req, res, next) {
        try {
            const { staffId } = req.params;
            const result = await adminService.updateStaff(staffId, req.body);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật nhân viên thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteStaff(req, res, next) {
        try {
            const { staffId } = req.params;
            await adminService.deleteStaff(staffId);
            return res.status(200).json(
                ApiResponse.success(200, 'Xóa tài khoản nhân viên thành công', null)
            );
        } catch (error) {
            next(error);
        }
    }

    // Phân quyền (include của Quản lí nhân viên)
    async assignRole(req, res, next) {
        try {
            const { staffId } = req.params;
            const { roleId } = req.body;
            const result = await adminService.assignRole(staffId, roleId);
            return res.status(200).json(
                ApiResponse.success(200, 'Phân quyền thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ── Quản lí khách hàng ─────────────────────────────────────

    async getAllCustomers(req, res, next) {
        try {
            const { page, limit, search } = req.query;
            const result = await adminService.getAllCustomers({ page, limit, search });
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách khách hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async getCustomerDetail(req, res, next) {
        try {
            const { customerId } = req.params;
            const result = await adminService.getCustomerDetail(customerId);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thông tin khách hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async toggleCustomerStatus(req, res, next) {
        try {
            const { customerId } = req.params;
            const result = await adminService.toggleCustomerStatus(customerId);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật trạng thái khách hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ── Quản lí hệ thống ───────────────────────────────────────

    async getSystemInfo(req, res, next) {
        try {
            const result = await adminService.getSystemInfo();
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thông tin hệ thống thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async getRoles(req, res, next) {
        try {
            const result = await adminService.getRoles();
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách role thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();