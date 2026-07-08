const mongoose = require('mongoose');

const refundItemSchema = new mongoose.Schema({
    order_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: true
    },
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'item_type_ref',
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    item_type_ref: {
        type: String,
        required: true,
        enum: ['PhysicalProductItem', 'DigitalProductItem']
    },
    product_type: {
        type: String,
        enum: ['physical', 'digital'],
        required: true
    },
    refund_amount: {
        type: Number,
        required: true,
        min: 0
    },
    restocked: {
        type: Boolean,
        default: false
    },
    item_status_after: {
        type: String,
        enum: ['available', 'returned', 'expired'],
        default: 'returned'
    }
}, { _id: false});

const refundSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: [refundItemSchema],
        required: true,
    },
    total_refund_amount: {
        type: Number,
        required: true,
        min: 0
    },
    refund_method: {
        type: String,
        enum: ['bank_transfer', 'original_payment', 'store_credit'],
        default: 'original_payment',
        required: true
    },
    reason: {
        type: String,
        default: null,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['completed', 'rejected'],
        default: 'completed'
    },
    processed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    note: {
        type: String,
        default: null,
        maxlength: 500
    }
}, {
    timestamps: true
});

refundSchema.index({ order_id: 1, createdAt: -1 });

module.exports = mongoose.model('Refund', refundSchema);
