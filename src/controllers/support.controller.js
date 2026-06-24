const supportService = require('../services/support.service');
const ApiResponse = require('../utils/api.response');

class SupportController {

    // ══════════════════════════════════════════════════════════
    //  CUSTOMER
    // ══════════════════════════════════════════════════════════

    // POST /api/v1/support/tickets
    async createTicket(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await supportService.createTicket(userId, req.body);
            return res.status(201).json(
                ApiResponse.success(201, 'Tạo yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/support/tickets
    async getMyTickets(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await supportService.getMyTickets(userId, req.query);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/support/tickets/:ticketId
    async getMyTicketDetail(req, res, next) {
        try {
            const userId = req.user.id;
            const { ticketId } = req.params;
            const result = await supportService.getMyTicketDetail(userId, ticketId);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy chi tiết yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // POST /api/v1/support/tickets/:ticketId/messages
    async sendCustomerMessage(req, res, next) {
        try {
            const userId = req.user.id;
            const { ticketId } = req.params;
            const result = await supportService.sendCustomerMessage(userId, ticketId, req.body);
            return res.status(201).json(
                ApiResponse.success(201, 'Gửi tin nhắn thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/support/tickets/:ticketId/cancel
    async cancelTicket(req, res, next) {
        try {
            const userId = req.user.id;
            const { ticketId } = req.params;
            const result = await supportService.cancelTicket(userId, ticketId);
            return res.status(200).json(
                ApiResponse.success(200, 'Hủy yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/support/tickets/:ticketId/reopen
    async reopenTicket(req, res, next) {
        try {
            const userId = req.user.id;
            const { ticketId } = req.params;
            const result = await supportService.reopenTicket(userId, ticketId);
            return res.status(200).json(
                ApiResponse.success(200, 'Mở lại yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/support/tickets/:ticketId/close
    async closeTicket(req, res, next) {
        try {
            const userId = req.user.id;
            const { ticketId } = req.params;
            const result = await supportService.closeTicket(userId, ticketId, req.body);
            return res.status(200).json(
                ApiResponse.success(200, 'Đóng yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  STAFF / ADMIN
    // ══════════════════════════════════════════════════════════

    // GET /api/v1/support/manage/tickets
    async getAllTickets(req, res, next) {
        try {
            const result = await supportService.getAllTickets(req.query);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/support/manage/tickets/:ticketId
    async getTicketDetail(req, res, next) {
        try {
            const { ticketId } = req.params;
            const result = await supportService.getTicketDetail(ticketId);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy chi tiết yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/support/manage/tickets/:ticketId/assign
    async assignTicket(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { staff_id } = req.body;
            const result = await supportService.assignTicket(ticketId, staff_id);
            return res.status(200).json(
                ApiResponse.success(200, 'Assign ticket thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/support/manage/tickets/:ticketId/priority
    async updatePriority(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { priority } = req.body;
            const result = await supportService.updatePriority(ticketId, priority);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật độ ưu tiên thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // POST /api/v1/support/manage/tickets/:ticketId/messages
    async sendStaffMessage(req, res, next) {
        try {
            const staffId = req.user.id;
            const staffRole = req.user.role;
            const { ticketId } = req.params;
            const result = await supportService.sendStaffMessage(staffId, staffRole, ticketId, req.body);
            return res.status(201).json(
                ApiResponse.success(201, 'Gửi tin nhắn thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/support/manage/tickets/:ticketId/resolve
    async resolveTicket(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { resolution_note } = req.body;
            const result = await supportService.resolveTicket(ticketId, resolution_note);
            return res.status(200).json(
                ApiResponse.success(200, 'Giải quyết yêu cầu hỗ trợ thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/support/manage/stats
    async getStats(req, res, next) {
        try {
            const result = await supportService.getStats();
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thống kê thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SupportController();