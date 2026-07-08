const Joi = require('joi');

const processRefundSchema = Joi.object({
    order_item_ids: Joi.array()
        .items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/))
        .optional()
        .messages({ 'string.pattern.base': 'order_item_id không hợp lệ' }),
    // Nếu không truyền order_item_ids -> hoàn toàn bộ đơn

    reason: Joi.string().min(10).max(500).required().messages({
        'string.empty': 'Lý do hoàn tiền không được để trống',
        'string.min': 'Lý do phải có ít nhất 10 ký tự',
        'any.required': 'Lý do hoàn tiền là bắt buộc'
    }),

    refund_method: Joi.string()
        .valid('original_payment', 'bank_transfer', 'store_credit')
        .optional(),

    restock_physical: Joi.boolean().optional().default(false),

    ticket_id: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional().allow(null)
});

module.exports = { processRefundSchema };