const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Tất cả route yêu cầu đăng nhập — dùng chung cho customer/staff/admin
// vì mỗi user chỉ thấy thông báo của chính mình (lọc theo recipient_id = req.user.id)
router.use(authenticate);

router.get('/', (req, res, next) => notificationController.getMyNotifications(req, res, next));
router.get('/unread-count', (req, res, next) => notificationController.getUnreadCount(req, res, next));
router.put('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.put('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.delete('/read', (req, res, next) => notificationController.deleteAllRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationController.deleteNotification(req, res, next));

module.exports = router;