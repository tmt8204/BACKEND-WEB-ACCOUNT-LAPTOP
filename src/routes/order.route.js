const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createOrderSchema, cancelOrderSchema } = require('../middlewares/validators/order.validator');

const router = express.Router();

// Tạo đơn hàng (customer)
router.post(
    '/create',
    authenticate,
    validate(createOrderSchema),
    (req, res, next) => orderController.createOrder(req, res, next)
);

// Lấy danh sách đơn hàng của tôi
router.get(
    '/my-orders',
    authenticate,
    (req, res, next) => orderController.getMyOrders(req, res, next)
);

// Lấy chi tiết đơn hàng
router.get(
    '/:orderId',
    authenticate,
    (req, res, next) => orderController.getOrder(req, res, next)
);

// Huỷ đơn hàng
router.put(
    '/:orderId/cancel',
    authenticate,
    validate(cancelOrderSchema),
    (req, res, next) => orderController.cancelOrder(req, res, next)
);

module.exports = router;