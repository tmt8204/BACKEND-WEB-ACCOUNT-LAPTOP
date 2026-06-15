const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'items.item_type_ref'
    },
    // Dùng refPath để populate đúng model
    item_type_ref: {
        type: String,
        required: true,
        enum: ['PhysicalProductItem', 'DigitalProductItem']
    },
    // Snapshot tại thời điểm đặt hàng (tránh mất dữ liệu khi product thay đổi)
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    product_name: {
        type: String,
        required: true
    },
    product_type: {
        type: String,
        enum: ['physical', 'digital'],
        required: true
    },
    sale_price: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: [orderItemSchema],
        validate: {
            validator: v => Array.isArray(v) && v.length > 0,
            message: 'Order phải có ít nhất 1 sản phẩm'
        }
    },
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    // null nếu toàn bộ item là digital
    shipping_address: {
        type: String,
        default: null
    },
    payment_method: {
        type: String,
        enum: ['cod', 'bank_transfer'],
        required: true
    },
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null
    },
    status: {
        type: String,
        enum: [
            'pending',      // vừa tạo, chờ thanh toán
            'confirmed',    // thanh toán thành công (bank_transfer) hoặc COD confirmed
            'processing',   // đang chuẩn bị / giao hàng
            'completed',    // hoàn tất
            'cancelled',    // huỷ
            'failed'        // thanh toán thất bại / hết hạn
        ],
        default: 'pending'
    },
    note: {
        type: String,
        default: null
    },
    cancel_reason: {
        type: String,
        default: null
    },
    cancelled_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ payment_id: 1 });

module.exports = mongoose.model('Order', orderSchema);