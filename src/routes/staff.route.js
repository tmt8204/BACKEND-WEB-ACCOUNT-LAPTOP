const express = require('express');
const staffController = require('../controllers/staff.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
    updateOrderStatusSchema
} = require('../middlewares/validators/staff.validator');

const router = express.Router();

// ======================================================
// DASHBOARD
// ======================================================

// Dashboard Staff
router.get(
    '/dashboard',
    authenticate,
    authorizeRoles(['staff']),
    staffController.getDashboard
);

// ======================================================
// QUẢN LÝ ĐƠN HÀNG
// ======================================================

// Lấy tất cả đơn hàng
router.get(
    '/orders',
    authenticate,
    authorizeRoles(['staff']),
    staffController.getAllOrders
);

// Xem chi tiết đơn hàng
router.get(
    '/orders/:orderId',
    authenticate,
    authorizeRoles(['staff']),
    staffController.getOrderDetail
);

// Cập nhật trạng thái đơn hàng
router.patch(
    '/orders/:orderId/status',
    authenticate,
    authorizeRoles(['staff']),
    validate(updateOrderStatusSchema),
    staffController.updateOrderStatus
);

// Thống kê số lượng đơn theo trạng thái
router.get(
    '/orders/statistics',
    authenticate,
    authorizeRoles(['staff']),
    staffController.getOrderStatistics
);

module.exports = router;