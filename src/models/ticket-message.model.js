const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
    ticket_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportTicket',
        required: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender_role: {
        type: String,
        enum: ['customer', 'staff', 'admin'],
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    attachments: {
        type: [String],
        default: []
    },
    // true = chỉ staff/admin thấy, customer không thấy
    is_internal: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

ticketMessageSchema.index({ ticket_id: 1, createdAt: 1 });

module.exports = mongoose.model('TicketMessage', ticketMessageSchema);