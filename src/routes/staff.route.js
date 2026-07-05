const express = require('express');
const staffController = require('../controllers/staff.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
    updateOrderStatusSchema,
    getOrdersSchema
} = require('../middlewares/validators/staff.validator');

const router = express.Router();

// ======================================================
// DASHBOARD
// ======================================================

// Dashboard Staff
router.get(
    '/dashboard',
    authenticate,
    authorizeRoles(['staff', 'admin']),
    staffController.getDashboard
);

// ======================================================
// QUẢN LÝ ĐƠN HÀNG
// ======================================================

// Lấy tất cả đơn hàng
router.get(
    '/orders',
    authenticate,
    authorizeRoles(['staff', 'admin']),
    validate(getOrdersSchema),
    staffController.getAllOrders
);


// Cập nhật trạng thái đơn hàng
router.put(
    '/orders/:orderId/status',
    authenticate,
    authorizeRoles(['staff', 'admin']),
    validate(updateOrderStatusSchema),
    staffController.updateOrderStatus
);

// Thống kê số lượng đơn theo trạng thái
router.get(
    '/orders/statistics',
    authenticate,
    authorizeRoles(['staff', 'admin']),
    staffController.getOrderStatistics
);


// Xem chi tiết đơn hàng
router.get(
    '/orders/:orderId',
    authenticate,
    authorizeRoles(['staff', 'admin']),
    staffController.getOrderDetail
); 

module.exports = router;