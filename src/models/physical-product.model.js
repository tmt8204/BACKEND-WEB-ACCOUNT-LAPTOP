const mongoose = require('mongoose');

const physicalProductSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true
    },
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    weight_kg: {
        type: Number,
        required: true,
        min: 0
    },
    cpu: {
        type: String,
        required: true
    },
    gpu: {
        type: String,
        required: true
    },
    ram: {
        type: String,
        required: true
    },
    storage: {
        type: String,
        required: true
    },
    display_inches: {
        type: Number,
        required: true,
        min: 0
    },
    os: {
        type: String,
        required: true
    },
    condition_percent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    warranty_months: {
        type: Number,
        required: true,
        min: 0
    },
    important_price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PhysicalProduct', physicalProductSchema);