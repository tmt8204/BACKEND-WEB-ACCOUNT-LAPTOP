const Joi = require('joi');

const createOrderSchema = Joi.object({
    items: Joi.array()
        .items(
            Joi.object({
                item_id: Joi.string()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .required()
                    .messages({
                        'string.pattern.base': 'item_id không hợp lệ (phải là MongoDB ObjectId)',
                        'any.required': 'item_id là bắt buộc'
                    }),
                item_type: Joi.string()
                    .valid('physical', 'digital')
                    .required()
                    .messages({
                        'any.only': 'item_type phải là physical hoặc digital',
                        'any.required': 'item_type là bắt buộc'
                    })
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'Đơn hàng phải có ít nhất 1 sản phẩm',
            'any.required': 'items là bắt buộc'
        }),

    payment_method: Joi.string()
        .valid('cod', 'bank_transfer')
        .required()
        .messages({
            'any.only': 'Phương thức thanh toán phải là cod hoặc bank_transfer',
            'any.required': 'Phương thức thanh toán là bắt buộc'
        }),

    shipping_address: Joi.string()
        .max(300)
        .optional()
        .allow('', null),

    note: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
});

const cancelOrderSchema = Joi.object({
    cancel_reason: Joi.string()
        .max(300)
        .optional()
        .allow('', null)
});

module.exports = {
    createOrderSchema,
    cancelOrderSchema
};