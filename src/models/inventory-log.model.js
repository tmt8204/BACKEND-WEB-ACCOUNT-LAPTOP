const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'item_type_ref'
    },
    item_type_ref: {
        type: String,
        required: true,
        enum: ['PhysicalProductItem', 'DigitalProductItem']
    },
    product_type: {
        type: String,
        required: true,
        enum: ['physical', 'digital']
    },
    action: {
        type: String,
        required: true,
        // stock_in  : nhập kho (thêm item mới)
        // stock_out : xuất kho (item bị bán / xoá)
        // adjustment: chỉnh trạng thái thủ công
        // refund_in: hoàn tiền (item bị trả lại)
        enum: ['stock_in', 'stock_out', 'adjustment', 'refund_in'],
    },
    // Trạng thái item trước và sau khi thay đổi
    status_before: {
        type: String,
        default: null
    },
    status_after: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: null
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: true
    }
}, {
    timestamps: true
});

inventoryLogSchema.index({ product_id: 1, createdAt: -1 });
inventoryLogSchema.index({ created_by: 1 });
inventoryLogSchema.index({ action: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);