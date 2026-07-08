const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 150
    },
    image: {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
    },
    link_url: {
        type: String,
        default: null // vd: link tới trang sản phẩm/khuyến mãi
    },
    position: {
        type: String,
        enum: ['home_top', 'home_middle', 'category_page', 'popup'],
        default: 'home_top'
    },
    display_order: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    start_date: {
        type: Date,
        default: null
    },
    end_date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

bannerSchema.index({ position: 1, is_active: 1, display_order: 1 });

module.exports = mongoose.model('Banner', bannerSchema);