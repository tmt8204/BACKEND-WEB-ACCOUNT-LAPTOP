const Joi = require('joi');

const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2|6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;

// ======================================================
// QUẢN LÝ NHÂN VIÊN (STAFF)
// ======================================================

// Schema cho API: POST /api/admin/staffs
const createStaffSchema = Joi.object({
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
        .pattern(VN_PHONE_REGEX)
        .required()
        .messages({
        'string.empty': 'Số điện thoại không được để trống',
        'string.pattern.base': 'Số điện thoại không đúng định dạng số Việt Nam (vd: 0912345678 hoặc +84912345678)',
        'any.required': 'Số điện thoại là bắt buộc'
        }),
    address: Joi.string().max(200).allow('').optional(),
    position: Joi.string().max(50).allow('').optional()
});

// Schema cho API: PUT /api/admin/staffs/:staffId
const updateStaffSchema = Joi.object({
    fullname: Joi.string().min(3).max(50).optional(),
    phone: Joi.string()
    .pattern(VN_PHONE_REGEX)
    .required()
    .messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không đúng định dạng số Việt Nam (vd: 0912345678 hoặc +84912345678)',
      'any.required': 'Số điện thoại là bắt buộc'
    }),
    address: Joi.string().max(200).allow('').optional(),
    position: Joi.string().max(50).allow('').optional(),
    isActive: Joi.boolean().optional()
}).min(1); // Ít nhất phải truyền lên một trường để cập nhật

// Schema cho API: PATCH /api/admin/staffs/:staffId/assign-role
const assignRoleSchema = Joi.object({
    roleId: Joi.string().hex().length(24).required().messages({
        'string.length': 'roleId phải là định dạng MongoDB ObjectId hợp lệ (24 ký tự hex)'
    })
});


// ======================================================
// DASHBOARD & BÁO CÁO (REPORT)
// ======================================================

// Schema validate Query Params cho API: GET /api/admin/reports?from=...&to=...&type=...
const getReportSchema = Joi.object({
    from: Joi.date().iso().optional().messages({
        'date.format': 'Định dạng ngày bắt đầu (from) không hợp lệ (Chuẩn ISO YYYY-MM-DD)'
    }),
    to: Joi.date().iso().optional().messages({
        'date.format': 'Định dạng ngày kết thúc (to) không hợp lệ (Chuẩn ISO YYYY-MM-DD)'
    }),
    type: Joi.string().valid('revenue', 'products', 'customers').default('revenue').optional()
});

module.exports = {
    createStaffSchema,
    updateStaffSchema,
    assignRoleSchema,
    getReportSchema
};