// src/models/notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Người nhận cụ thể (cá nhân). Nếu null -> đây là thông báo broadcast theo role (xem target_role)
    recipient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Vai trò của người nhận tại thời điểm tạo (để lọc nhanh, không cần populate)
    recipient_role: {
        type: String,
        enum: ['customer', 'staff', 'admin'],
        required: true
    },

    type: {
        type: String,
        enum: [
            'order_created',       // đơn hàng mới được tạo
            'order_status_changed',// trạng thái đơn thay đổi
            'payment_success',     // thanh toán thành công
            'payment_failed',      // thanh toán thất bại/hết hạn
            'refund_processed',    // đã hoàn tiền
            'refund_rejected',     // từ chối hoàn tiền
            'support_new_ticket',  // ticket mới (báo cho staff/admin)
            'support_new_message', // có tin nhắn mới trong ticket
            'support_status_changed', // ticket đổi trạng thái (resolved/rejected/closed)
            'inventory_low_stock', // cảnh báo sắp hết hàng (báo cho staff/admin)
            'system'                // thông báo hệ thống chung
        ],
        required: true
    },

    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },

    // Dữ liệu tham chiếu để frontend điều hướng (order_id, ticket_id, ...)
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Đường dẫn gợi ý cho frontend (vd: /orders/:id, /support/tickets/:id)
    link: {
        type: String,
        default: null
    },

    is_read: {
        type: Boolean,
        default: false
    },
    read_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

notificationSchema.index({ recipient_id: 1, createdAt: -1 });
notificationSchema.index({ recipient_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);