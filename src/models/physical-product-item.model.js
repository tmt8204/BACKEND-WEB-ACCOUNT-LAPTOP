const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    public_id: { type: String, required: true }
}, { _id: false });

const physicalProductItemSchema = new mongoose.Schema({
    physical_product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhysicalProduct',
        required: true,
    },
    serial_number: {
        type: String,
        required: true,
        unique: true
    },
    images_urls: {
        type: [imageSchema ],
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