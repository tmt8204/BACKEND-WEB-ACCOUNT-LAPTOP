const express = require('express');
const refundController = require('../controllers/refund.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { processRefundSchema } = require('../middlewares/validators/refund.validator');

const router = express.Router();

// Chỉ staff/admin mới được xử lý hoàn tiền
router.post(
    '/orders/:orderId',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    validate(processRefundSchema),
    (req, res, next) => refundController.processRefund(req, res, next)
);

router.get(
    '/orders/:orderId',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    (req, res, next) => refundController.getRefundsByOrder(req, res, next)
);

router.get(
    '/:refundId',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    (req, res, next) => refundController.getRefundDetail(req, res, next)
);

router.get(
    '/',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    (req, res, next) => refundController.getAllRefunds(req, res, next)
);

module.exports = router;