const mongoose = require('mongoose');

const digitalProductSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true
    },
    platform: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    duration_months: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DigitalProduct', digitalProductSchema);