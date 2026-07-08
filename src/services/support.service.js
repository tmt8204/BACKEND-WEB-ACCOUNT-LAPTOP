const supportTicketRepo = require('../repositories/support-ticket.repository');
const ticketMessageRepo = require('../repositories/ticket-message.repository');
const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const PhysicalProduct = require('../models/physical-product.model');
const refundService = require('./refund.service');

const REOPEN_WINDOW_DAYS = 7;   // số ngày customer được reopen sau khi resolved
const AUTO_CLOSE_DAYS = 7;      // số ngày tự động close sau khi resolved

// Status hợp lệ để gửi tin nhắn
const ACTIVE_STATUSES = ['open', 'in_progress', 'waiting_customer', 'reopened'];

class SupportService {

    // ══════════════════════════════════════════════════════════
    //  CUSTOMER
    // ══════════════════════════════════════════════════════════

    async createTicket(userId, data) {
        const { order_id, order_item_id, type, title, description, attachments = [] } = data;

        // 1. Verify order thuộc về user và đã completed
        const order = await orderRepository.findOrderById(order_id);
        if (!order) {
            const err = new Error('Đơn hàng không tồn tại');
            err.statusCode = 404;
            throw err;
        }
        if (order.user_id._id.toString() !== userId.toString()) {
            const err = new Error('Bạn không có quyền thực hiện yêu cầu này');
            err.statusCode = 403;
            throw err;
        }
        if (order.status !== 'completed' && order.status !== 'confirmed') {
            const err = new Error('Chỉ có thể tạo yêu cầu hỗ trợ cho đơn hàng đã hoàn thành');
            err.statusCode = 400;
            throw err;
        }

        // 2. Verify order_item_id thuộc về order này
        const orderItem = order.items.find(
            i => i._id.toString() === order_item_id.toString()
        );
        if (!orderItem) {
            const err = new Error('Sản phẩm không thuộc đơn hàng này');
            err.statusCode = 400;
            throw err;
        }

        // 3. Kiểm tra đã có ticket active cho item này chưa
        const existingTicket = await supportTicketRepo.findActiveTicketByOrderItem(order_item_id);
        if (existingTicket) {
            const err = new Error(
                `Sản phẩm này đã có yêu cầu hỗ trợ đang xử lý (${existingTicket.ticket_code})`
            );
            err.statusCode = 400;
            throw err;
        }

        // 4. Validate warranty chỉ áp dụng cho physical
        if (type === 'warranty' && orderItem.product_type !== 'physical') {
            const err = new Error('Bảo hành chỉ áp dụng cho sản phẩm vật lý');
            err.statusCode = 400;
            throw err;
        }

        // 5. Tính warranty nếu cần
        let warranty_expires_at = null;
        let warranty_valid = null;

        if (type === 'warranty') {
            // Lấy warranty_months từ PhysicalProduct qua item_id
            const physicalProduct = await PhysicalProduct.findOne({
                _id: { $exists: true }
            }).where('_id').equals(
                // item_id trong orderItem trỏ tới PhysicalProductItem
                // cần tìm PhysicalProduct qua physical_product_id
                orderItem.item_id
            );

            // Tìm qua populate chain: PhysicalProductItem → PhysicalProduct
            const PhysicalProductItem = require('../models/physical-product-item.model');
            const physItem = await PhysicalProductItem.findById(orderItem.item_id)
                .populate('physical_product_id');

            const warrantyMonths = physItem?.physical_product_id?.warranty_months ?? 0;

            // warranty tính từ ngày đặt hàng
            warranty_expires_at = new Date(order.createdAt);
            warranty_expires_at.setMonth(warranty_expires_at.getMonth() + warrantyMonths);
            warranty_valid = new Date() <= warranty_expires_at;
        }

        // 6. Tạo ticket
        const ticket = await supportTicketRepo.createTicket({
            user_id: userId,
            order_id,
            order_item_id,
            product_name: orderItem.product_name,
            product_type: orderItem.product_type,
            type,
            title,
            description,
            attachments,
            warranty_expires_at,
            warranty_valid
        });

        // 7. Tạo message đầu tiên (nội dung description)
        await ticketMessageRepo.createMessage({
            ticket_id: ticket._id,
            sender_id: userId,
            sender_role: 'customer',
            content: description,
            attachments,
            is_internal: false
        });

        return ticket;
    }

    async getMyTickets(userId, query) {
        const { page = 1, limit = 10, status, type } = query;
        return await supportTicketRepo.findTicketsByUser(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            type
        });
    }

    async getMyTicketDetail(userId, ticketId) {
        const ticket = await this._getTicketOrThrow(ticketId);
        this._assertOwner(ticket, userId);

        // Chỉ lấy message public (is_internal = false)
        const messages = await ticketMessageRepo.findMessagesByTicket(ticketId, false);
        return { ticket, messages };
    }

    async sendCustomerMessage(userId, ticketId, data) {
        const { content, attachments = [] } = data;
        const ticket = await this._getTicketOrThrow(ticketId);
        this._assertOwner(ticket, userId);

        if (!ACTIVE_STATUSES.includes(ticket.status)) {
            const err = new Error(`Không thể gửi tin nhắn khi ticket đang ở trạng thái "${ticket.status}"`);
            err.statusCode = 400;
            throw err;
        }

        const message = await ticketMessageRepo.createMessage({
            ticket_id: ticketId,
            sender_id: userId,
            sender_role: 'customer',
            content,
            attachments,
            is_internal: false
        });

        // Nếu đang chờ customer phản hồi thì chuyển lại in_progress
        if (ticket.status === 'waiting_customer') {
            await supportTicketRepo.updateTicket(ticketId, { status: 'in_progress' });
        }

        return message;
    }

    async cancelTicket(userId, ticketId) {
        const ticket = await this._getTicketOrThrow(ticketId);
        this._assertOwner(ticket, userId);

        if (ticket.status !== 'open') {
            const err = new Error('Chỉ có thể hủy ticket đang ở trạng thái mở');
            err.statusCode = 400;
            throw err;
        }

        return await supportTicketRepo.updateTicket(ticketId, {
            status: 'cancelled',
            cancelled_at: new Date()
        });
    }

    async reopenTicket(userId, ticketId) {
        const ticket = await this._getTicketOrThrow(ticketId);
        this._assertOwner(ticket, userId);

        if (ticket.status !== 'resolved') {
            const err = new Error('Chỉ có thể mở lại ticket đã được giải quyết');
            err.statusCode = 400;
            throw err;
        }

        // Kiểm tra còn trong window 7 ngày không
        const windowMs = REOPEN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        if (new Date() - new Date(ticket.resolved_at) > windowMs) {
            const err = new Error(
                `Đã quá ${REOPEN_WINDOW_DAYS} ngày kể từ khi giải quyết, không thể mở lại ticket`
            );
            err.statusCode = 400;
            throw err;
        }

        return await supportTicketRepo.updateTicket(ticketId, {
            status: 'reopened',
            resolved_at: null,
            resolution_note: null
        });
    }

    async closeTicket(userId, ticketId, data) {
        const { rating, rating_comment } = data;
        const ticket = await this._getTicketOrThrow(ticketId);
        this._assertOwner(ticket, userId);

        if (ticket.status !== 'resolved') {
            const err = new Error('Chỉ có thể đóng ticket đã được giải quyết');
            err.statusCode = 400;
            throw err;
        }

        return await supportTicketRepo.updateTicket(ticketId, {
            status: 'closed',
            closed_at: new Date(),
            ...(rating && { rating }),
            ...(rating_comment && { rating_comment })
        });
    }

    // ══════════════════════════════════════════════════════════
    //  STAFF / ADMIN
    // ══════════════════════════════════════════════════════════

    async getAllTickets(query) {
        const {
            page = 1, limit = 10,
            status, type, priority, assigned_to,
            unassigned, search
        } = query;

        return await supportTicketRepo.findAllTickets({
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            type,
            priority,
            assigned_to,
            unassigned: unassigned === 'true',
            search
        });
    }

    async getTicketDetail(ticketId) {
        const ticket = await this._getTicketOrThrow(ticketId);
        // Staff/admin thấy tất cả message kể cả internal
        const messages = await ticketMessageRepo.findMessagesByTicket(ticketId, true);
        return { ticket, messages };
    }

    async assignTicket(ticketId, staffId) {
        // Verify staffId có role staff
        const staff = await userRepository.findUserById(staffId);
        if (!staff) {
            const err = new Error('Nhân viên không tồn tại');
            err.statusCode = 404;
            throw err;
        }
        if (staff.role?.name !== 'staff' && staff.role?.name !== 'admin') {
            const err = new Error('Chỉ có thể assign cho nhân viên hoặc admin');
            err.statusCode = 400;
            throw err;
        }

        const ticket = await this._getTicketOrThrow(ticketId);

        const updateData = { assigned_to: staffId };
        // Nếu ticket đang open thì chuyển in_progress
        if (ticket.status === 'open') {
            updateData.status = 'in_progress';
        }

        return await supportTicketRepo.updateTicket(ticketId, updateData);
    }

    async updatePriority(ticketId, priority) {
        await this._getTicketOrThrow(ticketId);
        return await supportTicketRepo.updateTicket(ticketId, { priority });
    }

    async sendStaffMessage(staffId, staffRole, ticketId, data) {
        const { content, attachments = [], is_internal = false } = data;
        const ticket = await this._getTicketOrThrow(ticketId);

        if (!ACTIVE_STATUSES.includes(ticket.status)) {
            const err = new Error(`Không thể gửi tin nhắn khi ticket đang ở trạng thái "${ticket.status}"`);
            err.statusCode = 400;
            throw err;
        }

        const message = await ticketMessageRepo.createMessage({
            ticket_id: ticketId,
            sender_id: staffId,
            sender_role: staffRole,
            content,
            attachments,
            is_internal
        });

        // Chỉ đổi status khi gửi message public
        if (!is_internal && ticket.status !== 'waiting_customer') {
            await supportTicketRepo.updateTicket(ticketId, { status: 'waiting_customer' });
        }

        return message;
    }

    async resolveTicket(ticketId, resolution_note) {
        const ticket = await this._getTicketOrThrow(ticketId);

        const validStatuses = ['open', 'in_progress', 'waiting_customer', 'reopened'];
        if (!validStatuses.includes(ticket.status)) {
            const err = new Error(`Không thể giải quyết ticket đang ở trạng thái "${ticket.status}"`);
            err.statusCode = 400;
            throw err;
        }

        return await supportTicketRepo.updateTicket(ticketId, {
            status: 'resolved',
            resolution_note,
            resolved_at: new Date()
        });
    }

    async getStats() {
        return await supportTicketRepo.getStats();
    }

    async processRefundForTicket(ticketId, staffId, data = {}) {
        const { reason, refund_method, restock_physical } = data;

        const ticket = await this._getTicketOrThrow(ticketId);

        // Chỉ áp dụng cho ticket loại refund_request
        if (ticket.type !== 'refund_request') {
            const err = new Error('Chỉ có thể hoàn tiền cho yêu cầu loại refund_request');
            err.statusCode = 400;
            throw err;
        }

        // Ticket phải đang ở trạng thái xử lý được (chưa resolved/closed/cancelled)
        const validStatuses = ['open', 'in_progress', 'waiting_customer', 'reopened'];
        if (!validStatuses.includes(ticket.status)) {
            const err = new Error(
                `Không thể hoàn tiền khi ticket đang ở trạng thái "${ticket.status}"`
            );
            err.statusCode = 400;
            throw err;
        }

        // order_id đã được populate (chỉ có total_amount, status, createdAt) → lấy _id
        const orderId = ticket.order_id._id || ticket.order_id;

        // Gọi refund service — dùng đúng order_item_id đã gắn với ticket
        const result = await refundService.processRefund(orderId, staffId, {
            order_item_ids: [ticket.order_item_id.toString()],
            reason: reason || `Hoàn tiền theo yêu cầu hỗ trợ ${ticket.ticket_code}`,
            refund_method,
            restock_physical,
            ticket_id: ticket._id
        });

        return result;
        // Lưu ý: refund.service.js đã tự động resolve ticket này
        // (set status='resolved', resolution_note, resolved_at) — không cần làm lại ở đây
    }

    async rejectTicket(ticketId, staffId, { rejection_reason }) {
        const ticket = await this._getTicketOrThrow(ticketId);

        const validStatuses = ['open', 'in_progress', 'waiting_customer', 'reopened'];
        if (!validStatuses.includes(ticket.status)) {
            const err = new Error(
                `Không thể từ chối yêu cầu khi ticket đang ở trạng thái "${ticket.status}"`
            );
            err.statusCode = 400;
            throw err;
        }

        const updated = await supportTicketRepo.updateTicket(ticketId, {
            status: 'rejected',
            rejection_reason,
            rejected_at: new Date(),
            rejected_by: staffId
        });

        // Ghi lại thành 1 message hệ thống để khách thấy trong lịch sử hội thoại
        await ticketMessageRepo.createMessage({
            ticket_id: ticketId,
            sender_id: staffId,
            sender_role: 'staff',
            content: `Yêu cầu đã bị từ chối. Lý do: ${rejection_reason}`,
            attachments: [],
            is_internal: false
        });

        return updated;
    }

    // ══════════════════════════════════════════════════════════
    //  CRON JOB — tự động close ticket resolved quá 7 ngày
    // ══════════════════════════════════════════════════════════

    async autoCloseStaleTickets() {
        const staleTickets = await supportTicketRepo.findStaleResolvedTickets();
        let count = 0;

        for (const ticket of staleTickets) {
            await supportTicketRepo.updateTicket(ticket._id, {
                status: 'closed',
                closed_at: new Date()
            });
            count++;
        }

        return { auto_closed: count };
    }

    // ══════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════

    async _getTicketOrThrow(ticketId) {
        const ticket = await supportTicketRepo.findTicketById(ticketId);
        if (!ticket) {
            const err = new Error('Yêu cầu hỗ trợ không tồn tại');
            err.statusCode = 404;
            throw err;
        }
        return ticket;
    }

    _assertOwner(ticket, userId) {
        if (ticket.user_id._id.toString() !== userId.toString()) {
            const err = new Error('Bạn không có quyền thực hiện thao tác này');
            err.statusCode = 403;
            throw err;
        }
    }
}

module.exports = new SupportService();