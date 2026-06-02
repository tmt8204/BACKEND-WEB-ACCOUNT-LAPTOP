const Joi = require('joi');

const updateProfileSchema = Joi.object({
    fullname: Joi.string()
            .min(4)
            .max(50)
            .optional(),
    phone: Joi.string()
            .pattern(/^\d{10,15}$/)
            .optional(),
    address: Joi.string()
            .max(200)
            .optional(),
    position: Joi.string()
            .max(100)
            .optional()
})

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Mật khẩu hiện tại không được để trống',
            'any.required': 'Mật khẩu hiện tại là bắt buộc'
        }),
    newPassword: Joi.string()
        .min(8)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .messages({
            'string.empty': 'Mật khẩu mới không được để trống',
            'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
            'string.pattern.base': 'Mật khẩu mới phải chứa ít nhất một chữ cái viết thường, một chữ cái viết hoa, một chữ số và một ký tự đặc biệt',
            'any.required': 'Mật khẩu mới là bắt buộc'
        })
});

module.exports = {
    updateProfileSchema,
    changePasswordSchema
};