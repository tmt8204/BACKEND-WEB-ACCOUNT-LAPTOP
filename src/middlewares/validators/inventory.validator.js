const Joi = require('joi');

// ── Nhập kho vật lý ─────────────────────────────────────────────────────────
const stockInPhysicalSchema = Joi.object({
    serial_number: Joi.string().required().messages({
        'string.empty': 'Serial number không được để trống',
        'any.required': 'Serial number là bắt buộc'
    }),
    images_urls: Joi.array().items(Joi.string().uri()).optional(),
    sale_price: Joi.number().min(0).required().messages({
        'number.base':  'Giá bán phải là số',
        'number.min':   'Giá bán không được âm',
        'any.required': 'Giá bán là bắt buộc'
    }),
    status: Joi.string().valid('available', 'reserved', 'sold').optional(),
    note: Joi.string().max(300).optional().allow('', null)
});

// ── Nhập kho kỹ thuật số ─────────────────────────────────────────────────────
const stockInDigitalSchema = Joi.object({
    account_email: Joi.string().email().required().messages({
        'string.email': 'Email tài khoản không hợp lệ',
        'any.required': 'Email tài khoản là bắt buộc'
    }),
    account_password: Joi.string().min(1).required().messages({
        'string.empty': 'Mật khẩu tài khoản không được để trống',
        'any.required': 'Mật khẩu tài khoản là bắt buộc'
    }),
    expired_at: Joi.date().iso().optional().allow(null),
    sale_price: Joi.number().min(0).required().messages({
        'number.base':  'Giá bán phải là số',
        'number.min':   'Giá bán không được âm',
        'any.required': 'Giá bán là bắt buộc'
    }),
    status: Joi.string().valid('available', 'sold', 'expired').optional(),
    note: Joi.string().max(300).optional().allow('', null)
});

module.exports = {
    stockInPhysicalSchema,
    stockInDigitalSchema
};