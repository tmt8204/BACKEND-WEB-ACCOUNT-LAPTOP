const Joi = require('joi');

const objectId = Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .messages({ 'string.pattern.base': '{{#label}} không hợp lệ (phải là MongoDB ObjectId)' });

// ── Customer ───────────────────────────────────────────────────────────

const createTicketSchema = Joi.object({
    order_id: objectId.required().messages({
        'any.required': 'order_id là bắt buộc'
    }),
    order_item_id: objectId.required().messages({
        'any.required': 'order_item_id là bắt buộc'
    }),
    type: Joi.string()
        .valid('warranty', 'support', 'complaint', 'refund_request')
        .required()
        .messages({
            'any.only': 'type phải là warranty, support, complaint hoặc refund_request',
            'any.required': 'type là bắt buộc'
        }),
    title: Joi.string().min(10).max(200).required().messages({
        'string.empty': 'Tiêu đề không được để trống',
        'string.min': 'Tiêu đề phải có ít nhất 10 ký tự',
        'string.max': 'Tiêu đề không được vượt quá 200 ký tự',
        'any.required': 'Tiêu đề là bắt buộc'
    }),
    description: Joi.string().min(20).max(2000).required().messages({
        'string.empty': 'Mô tả không được để trống',
        'string.min': 'Mô tả phải có ít nhất 20 ký tự',
        'string.max': 'Mô tả không được vượt quá 2000 ký tự',
        'any.required': 'Mô tả là bắt buộc'
    }),
    attachments: Joi.array()
        .items(Joi.string().uri().message('URL ảnh không hợp lệ'))
        .max(5)
        .optional()
        .messages({ 'array.max': 'Tối đa 5 file đính kèm' })
});

const sendMessageSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required().messages({
        'string.empty': 'Nội dung tin nhắn không được để trống',
        'any.required': 'Nội dung tin nhắn là bắt buộc'
    }),
    attachments: Joi.array()
        .items(Joi.string().uri().message('URL ảnh không hợp lệ'))
        .max(5)
        .optional()
});

const closeTicketSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional().messages({
        'number.min': 'Đánh giá từ 1 đến 5 sao',
        'number.max': 'Đánh giá từ 1 đến 5 sao'
    }),
    rating_comment: Joi.string().max(500).optional().allow('', null)
});

// ── Staff / Admin ──────────────────────────────────────────────────────

const sendStaffMessageSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required().messages({
        'string.empty': 'Nội dung tin nhắn không được để trống',
        'any.required': 'Nội dung tin nhắn là bắt buộc'
    }),
    attachments: Joi.array()
        .items(Joi.string().uri().message('URL ảnh không hợp lệ'))
        .max(5)
        .optional(),
    is_internal: Joi.boolean().optional()
});

const assignTicketSchema = Joi.object({
    staff_id: objectId.required().messages({
        'any.required': 'staff_id là bắt buộc'
    })
});

const updatePrioritySchema = Joi.object({
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'urgent')
        .required()
        .messages({
            'any.only': 'priority phải là low, medium, high hoặc urgent',
            'any.required': 'priority là bắt buộc'
        })
});

const resolveTicketSchema = Joi.object({
    resolution_note: Joi.string().min(10).max(1000).required().messages({
        'string.empty': 'Ghi chú giải quyết không được để trống',
        'string.min': 'Ghi chú giải quyết phải có ít nhất 10 ký tự',
        'any.required': 'Ghi chú giải quyết là bắt buộc'
    })
});

const refundTicketSchema = Joi.object({
    reason: Joi.string().min(10).max(500).optional().messages({
        'string.min': 'Lý do hoàn tiền phải có ít nhất 10 ký tự'
    }),
    refund_method: Joi.string()
        .valid('original_payment', 'bank_transfer', 'store_credit')
        .optional(),
    restock_physical: Joi.boolean().optional().default(false)
});

const rejectTicketSchema = Joi.object({
    rejection_reason: Joi.string().min(10).max(500).required().messages({
        'string.empty': 'Lý do từ chối không được để trống',
        'string.min': 'Lý do từ chối phải có ít nhất 10 ký tự',
        'any.required': 'Lý do từ chối là bắt buộc'
    })
});


module.exports = {
    createTicketSchema,
    sendMessageSchema,
    closeTicketSchema,
    sendStaffMessageSchema,
    assignTicketSchema,
    updatePrioritySchema,
    resolveTicketSchema,
    refundTicketSchema,
    rejectTicketSchema
};