const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    method: {
        type: String,
        enum: ['cod', 'bank_transfer'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },

    // ── bank_transfer / SePay ──────────────────────────────────────────
    // Nội dung chuyển khoản unique để match với SePay webhook
    transfer_content: {
        type: String,
        default: null,
        index: true         // SePay webhook lookup theo field này
    },
    bank_account_number: {
        type: String,
        default: null
    },
    bank_account_name: {
        type: String,
        default: null
    },
    bank_name: {
        type: String,
        default: null
    },
    // Data trả về từ SePay webhook
    sepay_transaction_id: {
        type: String,
        default: null
    },
    sepay_reference_code: {
        type: String,
        default: null
    },
    paid_at: {
        type: Date,
        default: null
    },

    // ── COD ───────────────────────────────────────────────────────────
    cod_confirmed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    cod_confirmed_at: {
        type: Date,
        default: null
    },

    // Thời điểm hết hạn thanh toán (chỉ bank_transfer)
    expires_at: {
        type: Date,
        default: null
    },

    // Ghi chú thêm nếu cần
    note: {
        type: String,
        default: null
    },
    refunded_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    refunded_at: {
        type: Date,
        default: null
    },
    refund_reason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);