const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    is_active: {
        type: Boolean,
        default: true
    },
    base_price: {
        type: Number,
        required: true,
        min: 0
    },
    product_type: {
        type: String,
        required: true,
        enum: ['physical', 'digital']
    }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);