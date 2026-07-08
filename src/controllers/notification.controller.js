const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/api.response');

class NotificationController {

    // GET /api/v1/notification
    async getMyNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await notificationService.getMyNotifications(userId, req.query);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách thông báo thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/notification/unread-count
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await notificationService.getUnreadCount(userId);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy số thông báo chưa đọc thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/notification/:id/read
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await notificationService.markAsRead(userId, id);
            return res.status(200).json(
                ApiResponse.success(200, 'Đánh dấu đã đọc thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/v1/notification/read-all
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await notificationService.markAllAsRead(userId);
            return res.status(200).json(
                ApiResponse.success(200, 'Đánh dấu tất cả đã đọc thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // DELETE /api/v1/notification/:id
    async deleteNotification(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await notificationService.deleteNotification(userId, id);
            return res.status(200).json(
                ApiResponse.success(200, 'Xoá thông báo thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // DELETE /api/v1/notification/read
    async deleteAllRead(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await notificationService.deleteAllRead(userId);
            return res.status(200).json(
                ApiResponse.success(200, 'Xoá các thông báo đã đọc thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();