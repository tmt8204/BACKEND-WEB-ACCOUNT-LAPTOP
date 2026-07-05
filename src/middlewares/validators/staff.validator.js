const Joi = require('joi');

// Cập nhật trạng thái đơn hàng
const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid(
            'pending',
            'confirmed',
            'preparing',
            'processing',
            'delivered',
            'cancelled'
        )
        .required()
        .messages({
            'any.required': 'Trạng thái đơn hàng là bắt buộc.',
            'any.only':
                'Trạng thái phải là pending, confirmed, preparing, processing, delivered hoặc cancelled.'
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
            'pending',
            'confirmed',
            'preparing',
            'processing',
            'delivered',
            'cancelled'
        )
        .optional()
});

module.exports = {
    updateOrderStatusSchema,
    getOrdersSchema
};