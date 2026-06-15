const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

// Lấy thông tin thanh toán của một order (customer xem QR / thông tin CK)
router.get(
    '/order/:orderId',
    authenticate,
    (req, res, next) => paymentController.getPaymentInfo(req, res, next)
);

// SePay webhook — không cần authenticate, bảo vệ bằng SEPAY_WEBHOOK_TOKEN
router.post(
    '/webhook/sepay',
    (req, res, next) => paymentController.sePayWebhook(req, res, next)
);

// Staff xác nhận COD
router.post(
    '/cod/confirm/:orderId',
    authenticate,
    authorizeRoles(['admin', 'staff']),
    (req, res, next) => paymentController.confirmCOD(req, res, next)
);

module.exports = router;