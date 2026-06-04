const mongoose = require('mongoose');

const digitalProductSchema = new mongoose.Schema({
    digital_product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalProduct',
        required: true
    },
    account_email: {
        type: String,
        required: true
    },
    account_password: {
        type: String,
        required: true
    },
    expired_at: {
        type: Date,
        required: true,
        default: null
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'expired'],
        default: 'available'
    },
    sale_price: {
        type: Number,
        required: true,
        min: 0
    }
},{
    timestamps: true
});

module.exports = mongoose.model('DigitalProductItem', digitalProductSchema);