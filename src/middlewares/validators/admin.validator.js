const Joi = require('joi');

// ======================================================
// QUẢN LÝ NHÂN VIÊN (STAFF)
// ======================================================

// Schema cho API: POST /api/admin/staffs
const createStaffSchema = Joi.object({
    fullname: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required().messages({
        'string.pattern.base': 'Số điện thoại phải bao gồm 10-11 chữ số'
    }),
    password: Joi.string().min(6).max(30).required(),
    address: Joi.string().max(200).allow('').optional(),
    position: Joi.string().max(50).allow('').optional()
});

// Schema cho API: PUT /api/admin/staffs/:staffId
const updateStaffSchema = Joi.object({
    fullname: Joi.string().min(3).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional().messages({
        'string.pattern.base': 'Số điện thoại phải bao gồm 10-11 chữ số'
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