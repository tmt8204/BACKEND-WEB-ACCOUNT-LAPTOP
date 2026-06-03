const Joi = require('joi');

const registerSchema = Joi.object({
  fullname: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.empty': 'Họ tên không được để trống',
      'string.min': 'Họ tên phải có ít nhất 3 ký tự',
      'any.required': 'Họ tên là bắt buộc'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc'
    }),

  password: Joi.string()
    .min(8)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
      'string.pattern.base': 'Mật khẩu phải chứa ít nhất một chữ cái viết thường, một chữ cái viết hoa, một chữ số và một ký tự đặc biệt',
      'any.required': 'Mật khẩu là bắt buộc'
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại phải có 10 chữ số',
      'any.required': 'Số điện thoại là bắt buộc'
    })
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
        }),

    password: Joi.string()
        .required()
        .messages({
        'string.empty': 'Mật khẩu không được để trống',
        'any.required': 'Mật khẩu là bắt buộc'
        })
});

const verifyOTPSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
    otp: Joi.string()
        .length(6)
        .required()
        .messages({
            'string.empty': 'OTP không được để trống',
            'string.length': 'OTP phải có 6 ký tự',
            'any.required': 'OTP là bắt buộc'
        })
})

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string()
        .required()
        .messages({
            'string.empty': 'Refresh token không được để trống',
            'any.required': 'Refresh token là bắt buộc'
        })
});

const verifyEmailSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        })
});

const newPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
    newPassword: Joi.string()
        .min(8)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .messages({
            'string.empty': 'Mật khẩu không được để trống',
            'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
            'string.pattern.base': 'Mật khẩu phải chứa ít nhất một chữ cái viết thường, một chữ cái viết hoa, một chữ số và một ký tự đặc biệt',
            'any.required': 'Mật khẩu là bắt buộc'
        })
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  newPasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema
};