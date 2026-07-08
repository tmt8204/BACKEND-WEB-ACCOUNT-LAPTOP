const Notification = require('../models/notification.model');

class NotificationRepository {

    async createNotification(data) {
        try {
            const notification = new Notification(data);
            return await notification.save();
        } catch (error) {
            throw error;
        }
    }

    async createManyNotifications(dataArray) {
        try {
            if (!dataArray || dataArray.length === 0) return [];
            return await Notification.insertMany(dataArray);
        } catch (error) {
            throw error;
        }
    }

    async findByUser(userId, { page = 1, limit = 20, is_read, type } = {}) {
        try {
            const query = { recipient_id: userId };
            if (is_read !== undefined) query.is_read = is_read;
            if (type) query.type = type;

            const skip = (page - 1) * limit;
            const [notifications, total, unread_count] = await Promise.all([
                Notification.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Notification.countDocuments(query),
                Notification.countDocuments({ recipient_id: userId, is_read: false })
            ]);

            return { notifications, total, page, limit, totalPages: Math.ceil(total / limit), unread_count };
        } catch (error) {
            throw error;
        }
    }

    async countUnread(userId) {
        try {
            return await Notification.countDocuments({ recipient_id: userId, is_read: false });
        } catch (error) {
            throw error;
        }
    }

    async findById(notificationId) {
        try {
            return await Notification.findById(notificationId);
        } catch (error) {
            throw error;
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            return await Notification.findOneAndUpdate(
                { _id: notificationId, recipient_id: userId },
                { is_read: true, read_at: new Date() },
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            return await Notification.updateMany(
                { recipient_id: userId, is_read: false },
                { is_read: true, read_at: new Date() }
            );
        } catch (error) {
            throw error;
        }
    }

    async deleteNotification(notificationId, userId) {
        try {
            return await Notification.findOneAndDelete({ _id: notificationId, recipient_id: userId });
        } catch (error) {
            throw error;
        }
    }

    async deleteAllRead(userId) {
        try {
            return await Notification.deleteMany({ recipient_id: userId, is_read: true });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new NotificationRepository();