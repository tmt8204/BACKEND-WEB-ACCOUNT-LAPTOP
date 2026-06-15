const Joi = require('joi');

const addCartItemSchema = Joi.object({
    item_id: Joi.string()
        .pattern(/^[a-fA-F0-9]{24}$/)
        .required()
        .messages({
            'string.empty': 'item_id không được để trống',
            'string.pattern.base': 'item_id không hợp lệ',
            'any.required': 'item_id là bắt buộc'
        }),
    product_type: Joi.string()
        .valid('physical', 'digital')
        .required()
        .messages({
            'any.only': 'product_type phải là physical hoặc digital',
            'any.required': 'product_type là bắt buộc'
        }),
    quantity: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.min': 'Số lượng phải lớn hơn 0',
            'number.integer': 'Số lượng phải là số nguyên'
        })
});
 
const updateCartItemSchema = Joi.object({
    quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.min': 'Số lượng phải lớn hơn 0',
            'number.integer': 'Số lượng phải là số nguyên',
            'any.required': 'Số lượng là bắt buộc'
        })
});
 
module.exports = { addCartItemSchema, updateCartItemSchema };