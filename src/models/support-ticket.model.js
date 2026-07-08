const mongoose = require('mongoose');

// Tự tăng ticket_code dạng TK-000001
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const supportTicketSchema = new mongoose.Schema({
    ticket_code: {
        type: String,
        unique: true
    },

    // ── Liên kết ──────────────────────────────────────────────
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    order_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    // Snapshot tại thời điểm tạo ticket
    product_name: { type: String, required: true },
    product_type: { type: String, enum: ['physical', 'digital'], required: true },

    // ── Phân loại ─────────────────────────────────────────────
    type: {
        type: String,
        enum: ['warranty', 'support', 'complaint', 'refund_request'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // ── Nội dung ──────────────────────────────────────────────
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    attachments: { type: [String], default: [] },

    // ── Trạng thái ────────────────────────────────────────────
    status: {
        type: String,
        enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'cancelled', 'reopened', 'rejected'],
        default: 'open'
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // ── Bảo hành (chỉ dùng khi type = 'warranty') ────────────
    warranty_expires_at: { type: Date, default: null },
    warranty_valid: { type: Boolean, default: null },

    // ── Resolution ────────────────────────────────────────────
    resolution_note: { type: String, default: null },
    resolved_at: { type: Date, default: null },
    closed_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },

    // ── Đánh giá sau khi closed ───────────────────────────────
    rating: { type: Number, min: 1, max: 5, default: null },
    rating_comment: { type: String, default: null },

    // ── Hoàn tiền (chỉ dùng khi type = 'refund_request') ─────────
    rejection_reason: { type: String, default: null },
    rejected_at: { type: Date, default: null },
    rejected_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    refund_processed: { type: Boolean, default: false },
}, { timestamps: true });

// Index
supportTicketSchema.index({ user_id: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ assigned_to: 1 });
supportTicketSchema.index({ order_item_id: 1 });

// Auto-generate ticket_code trước khi save
supportTicketSchema.pre('save', async function () {
    if (this.ticket_code) return;

    const counter = await Counter.findOneAndUpdate(
        { _id: 'support_ticket' },
        { $inc: { seq: 1 } },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );

    this.ticket_code = `TK-${String(counter.seq).padStart(6, '0')}`;
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);