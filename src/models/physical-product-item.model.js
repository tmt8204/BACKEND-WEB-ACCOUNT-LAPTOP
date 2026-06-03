const mongoose = require('mongoose');

const physicalProductItemSchema = new mongoose.Schema({
    physical_product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhysicalProduct',
        required: true,
        unique: true
    },
    serial_number: {
        type: String,
        required: true,
        unique: true
    },
    images_urls: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'reserved', 'sold'],
        default: 'available'
    },
    sale_price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PhysicalProductItem', physicalProductItemSchema);