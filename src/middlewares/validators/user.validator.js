const Joi = require('joi');

const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2|6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;

const updateProfileSchema = Joi.object({
    fullname: Joi.string()
        .min(3)
        .required()
        .messages({
        'string.empty': 'Họ tên không được để trống',
        'string.min': 'Họ tên phải có ít nhất 3 ký tự',
        'any.required': 'Họ tên là bắt buộc'
        }),
    phone: Joi.string()
        .pattern(VN_PHONE_REGEX)
        .required()
        .messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không đúng định dạng số Việt Nam (vd: 0912345678 hoặc +84912345678)',
        'any.required': 'Số điện thoại là bắt buộc'
        }),
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