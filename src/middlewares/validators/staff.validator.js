const Joi = require('joi');

// Cập nhật trạng thái đơn hàng
const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid(
            'Đang chờ xác nhận',
            'Đã xác nhận',
            'Đang chuẩn bị',
            'Đang giao hàng',
            'Đã giao hàng',
            'Đã hủy'
        )
        .required()
        .messages({
            'any.required': 'Trạng thái đơn hàng là bắt buộc.',
            'any.only':
                'Trạng thái phải là Đang chờ xác nhận, Đã xác nhận, Đang chuẩn bị, Đang giao hàng, Đã giao hàng hoặc Đã hủy.'
        })
});

// Validate query khi lấy danh sách đơn hàng
const getOrdersSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),

    status: Joi.string()
        .valid(
            'Đang chờ xác nhận',
            'Đã xác nhận',
            'Đang chuẩn bị',
            'Đang giao hàng',
            'Đã giao hàng',
            'Đã hủy'
        )
        .optional()
});

module.exports = {
    updateOrderStatusSchema,
    getOrdersSchema
};