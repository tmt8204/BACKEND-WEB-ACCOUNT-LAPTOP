const Joi = require('joi');

const createOrderSchema = Joi.object({
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