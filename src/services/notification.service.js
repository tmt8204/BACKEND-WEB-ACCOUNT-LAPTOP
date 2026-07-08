const notificationRepository = require('../repositories/notification.repository');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');

class NotificationService {

    // ══════════════════════════════════════════════════════════
    //  GỬI THÔNG BÁO (dùng nội bộ — gọi từ các service khác)
    // ══════════════════════════════════════════════════════════

    /**
     * Gửi thông báo cho 1 user cụ thể.
     * @param {string} userId
     * @param {object} payload - { type, title, message, data?, link? }
     */
    async notifyUser(userId, { type, title, message, data = {}, link = null }) {
        try {
            const user = await userRepository.findUserById(userId);
            if (!user) return null; // im lặng bỏ qua nếu user không tồn tại, không throw để không chặn luồng chính

            return await notificationRepository.createNotification({
                recipient_id: userId,
                recipient_role: user.role?.name || 'customer',
                type, title, message, data, link
            });
        } catch (error) {
            // Thông báo không phải nghiệp vụ chính -> không throw để tránh rollback transaction cha
            console.error('[NotificationService] notifyUser error:', error.message);
            return null;
        }
    }

    /**
     * Gửi thông báo broadcast cho toàn bộ user có role chỉ định (staff hoặc admin).
     * Dùng cho: ticket mới, cảnh báo tồn kho...
     * @param {'staff'|'admin'} roleName
     */
    async notifyRole(roleName, { type, title, message, data = {}, link = null }) {
        try {
            const role = await roleRepository.findRoleByName(roleName);
            if (!role) return [];

            const users = await userRepository.findByRoleId(role._id, { isActive: true });
            if (users.length === 0) return [];

            const notifications = users.map(u => ({
                recipient_id: u._id,
                recipient_role: roleName,
                type, title, message, data, link
            }));

            return await notificationRepository.createManyNotifications(notifications);
        } catch (error) {
            console.error('[NotificationService] notifyRole error:', error.message);
            return [];
        }
    }

    /**
     * Gửi cho cả staff và admin cùng lúc (ví dụ: ticket mới, low stock)
     */
    async notifyStaffAndAdmin(payload) {
        const [staffResult, adminResult] = await Promise.all([
            this.notifyRole('staff', payload),
            this.notifyRole('admin', payload)
        ]);
        return [...staffResult, ...adminResult];
    }

    // ══════════════════════════════════════════════════════════
    //  API CHO NGƯỜI DÙNG (customer / staff / admin đều dùng chung)
    // ══════════════════════════════════════════════════════════

    async getMyNotifications(userId, query = {}) {
        try {
            const { page, limit, is_read, type } = query;
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(50, parseInt(limit) || 20);

            let isReadFilter;
            if (is_read === 'true') isReadFilter = true;
            else if (is_read === 'false') isReadFilter = false;

            return await notificationRepository.findByUser(userId, {
                page: pageNum, limit: limitNum, is_read: isReadFilter, type
            });
        } catch (error) {
            throw error;
        }
    }

    async getUnreadCount(userId) {
        try {
            const count = await notificationRepository.countUnread(userId);
            return { unread_count: count };
        } catch (error) {
            throw error;
        }
    }

    async markAsRead(userId, notificationId) {
        try {
            const notification = await notificationRepository.markAsRead(notificationId, userId);
            if (!notification) {
                const err = new Error('Thông báo không tồn tại hoặc không thuộc về bạn');
                err.statusCode = 404;
                throw err;
            }
            return notification;
        } catch (error) {
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            const result = await notificationRepository.markAllAsRead(userId);
            return { updated_count: result.modifiedCount };
        } catch (error) {
            throw error;
        }
    }

    async deleteNotification(userId, notificationId) {
        try {
            const notification = await notificationRepository.deleteNotification(notificationId, userId);
            if (!notification) {
                const err = new Error('Thông báo không tồn tại hoặc không thuộc về bạn');
                err.statusCode = 404;
                throw err;
            }
            return { message: 'Đã xoá thông báo' };
        } catch (error) {
            throw error;
        }
    }

    async deleteAllRead(userId) {
        try {
            const result = await notificationRepository.deleteAllRead(userId);
            return { deleted_count: result.deletedCount };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new NotificationService();