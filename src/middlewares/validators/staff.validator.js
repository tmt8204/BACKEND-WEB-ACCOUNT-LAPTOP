const Joi = require('joi');

// Cập nhật trạng thái đơn hàng
const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid(
            'Pending',
            'Confirmed',
            'Preparing',
            'Shipping',
            'Delivered',
            'Cancelled'
        )
        .required()
        .messages({
            'any.required': 'Trạng thái đơn hàng là bắt buộc.',
            'any.only':
                'Trạng thái phải là Pending, Confirmed, Preparing, Shipping, Delivered hoặc Cancelled.'
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
            'Pending',
            'Confirmed',
            'Preparing',
            'Shipping',
            'Delivered',
            'Cancelled'
        )
        .optional()
});

module.exports = {
    updateOrderStatusSchema,
    getOrdersSchema
};