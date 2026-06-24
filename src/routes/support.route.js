const express = require('express');
const router = express.Router();

const supportController = require('../controllers/support.controller');

const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const {
    createTicketSchema,
    sendMessageSchema,
    closeTicketSchema,
    sendStaffMessageSchema,
    assignTicketSchema,
    updatePrioritySchema,
    resolveTicketSchema
} = require('../middlewares/validators/support.validator');


// ======================================================
// CUSTOMER
// ======================================================

// Tạo ticket
router.post(
    '/tickets',
    authenticate,
    validate(createTicketSchema),
    supportController.createTicket
);

// Danh sách ticket của tôi
router.get(
    '/tickets',
    authenticate,
    supportController.getMyTickets
);

// Chi tiết ticket của tôi
router.get(
    '/tickets/:ticketId',
    authenticate,
    supportController.getMyTicketDetail
);

// Gửi tin nhắn
router.post(
    '/tickets/:ticketId/messages',
    authenticate,
    validate(sendMessageSchema),
    supportController.sendCustomerMessage
);

// Hủy ticket
router.put(
    '/tickets/:ticketId/cancel',
    authenticate,
    supportController.cancelTicket
);

// Reopen ticket
router.put(
    '/tickets/:ticketId/reopen',
    authenticate,
    supportController.reopenTicket
);

// Close ticket
router.put(
    '/tickets/:ticketId/close',
    authenticate,
    validate(closeTicketSchema),
    supportController.closeTicket
);


// ======================================================
// STAFF / ADMIN
// ======================================================

// Danh sách tất cả ticket
router.get(
    '/manage/tickets',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    supportController.getAllTickets
);

// Chi tiết ticket
router.get(
    '/manage/tickets/:ticketId',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    supportController.getTicketDetail
);

// Assign ticket
router.put(
    '/manage/tickets/:ticketId/assign',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    validate(assignTicketSchema),
    supportController.assignTicket
);

// Update priority
router.put(
    '/manage/tickets/:ticketId/priority',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    validate(updatePrioritySchema),
    supportController.updatePriority
);

// Staff gửi message
router.post(
    '/manage/tickets/:ticketId/messages',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    validate(sendStaffMessageSchema),
    supportController.sendStaffMessage
);

// Resolve ticket
router.put(
    '/manage/tickets/:ticketId/resolve',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    validate(resolveTicketSchema),
    supportController.resolveTicket
);

// Thống kê
router.get(
    '/manage/stats',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    supportController.getStats
);

module.exports = router;