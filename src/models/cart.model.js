const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'item_type' // Reference the item type to determine which collection to populate from
    },
    item_type: {
        type: String,
        enum: ['physical', 'digital'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    sale_price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    _id: true
});

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensure one cart per user
    },
    items: {
        type: [CartItemSchema],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);