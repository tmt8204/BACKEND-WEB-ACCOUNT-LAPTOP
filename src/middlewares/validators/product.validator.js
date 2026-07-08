const Joi = require('joi');

const imageSchema = Joi.object({
    url: Joi.string().uri().required(),
    public_id: Joi.string().required()
});

// ─────────────── CREATE ───────────────

const createPhysicalProductSchema = Joi.object({
    productData: Joi.object({
        name:        Joi.string().min(3).max(100).required(),
        description: Joi.string().max(500).allow('').optional(),
        base_price:  Joi.number().min(0).required()
    }).required(),
    physicalData: Joi.object({
        brand:             Joi.string().required(),
        model:             Joi.string().required(),
        weight_kg:         Joi.number().min(0).required(),
        cpu:               Joi.string().required(),
        gpu:               Joi.string().required(),
        ram:               Joi.string().required(),
        storage:           Joi.string().required(),
        display_inches:    Joi.number().min(0).required(),
        os:                Joi.string().required(),
        condition_percent: Joi.number().min(0).max(100).required(),
        warranty_months:   Joi.number().min(0).required(),
        important_price:   Joi.number().min(0).required()
    }).required(),
    itemData: Joi.object({
        serial_number: Joi.string().required(),
        images_urls:   Joi.array().items(imageSchema).optional(),
        status:        Joi.string().valid('available', 'reserved', 'sold').optional(),
        sale_price:    Joi.number().min(0).required()
    }).required()
});

const createDigitalProductSchema = Joi.object({
    productData: Joi.object({
        name:        Joi.string().min(3).max(100).required(),
        description: Joi.string().max(500).allow('').optional(),
        base_price:  Joi.number().min(0).required()
    }).required(),
    digitalData: Joi.object({
        platform:        Joi.string().required(),
        category:        Joi.string().required(),
        region:          Joi.string().required(),
        duration_months: Joi.number().integer().min(1).required()
    }).required(),
    itemData: Joi.object({
        account_email:    Joi.string().email().required(),
        account_password: Joi.string().min(1).required(),
        expired_at:       Joi.date().iso().optional(),
        status:           Joi.string().valid('available', 'reserved', 'sold').optional(),
        sale_price:       Joi.number().min(0).required()
    }).required()
});

// ─────────────── UPDATE ───────────────

const updatePhysicalProductSchema = Joi.object({
    productData: Joi.object({
        name:        Joi.string().min(3).max(100).optional(),
        description: Joi.string().max(500).allow('').optional(),
        base_price:  Joi.number().min(0).optional(),
        is_active:   Joi.boolean().optional()
    }).optional(),
    physicalData: Joi.object({
        brand:             Joi.string().optional(),
        model:             Joi.string().optional(),
        weight_kg:         Joi.number().min(0).optional(),
        cpu:               Joi.string().optional(),
        gpu:               Joi.string().optional(),
        ram:               Joi.string().optional(),
        storage:           Joi.string().optional(),
        display_inches:    Joi.number().min(0).optional(),
        os:                Joi.string().optional(),
        condition_percent: Joi.number().min(0).max(100).optional(),
        warranty_months:   Joi.number().min(0).optional(),
        important_price:   Joi.number().min(0).optional()
    }).optional()
}).min(1);   // ít nhất 1 trong 2 field phải có

const updateDigitalProductSchema = Joi.object({
    productData: Joi.object({
        name:        Joi.string().min(3).max(100).optional(),
        description: Joi.string().max(500).allow('').optional(),
        base_price:  Joi.number().min(0).optional(),
        is_active:   Joi.boolean().optional()
    }).optional(),
    digitalData: Joi.object({
        platform:        Joi.string().optional(),
        category:        Joi.string().optional(),
        region:          Joi.string().optional(),
        duration_months: Joi.number().integer().min(1).optional()
    }).optional()
}).min(1);

const updatePhysicalItemSchema = Joi.object({
    serial_number: Joi.string().optional(),
    images_urls:   Joi.array().items(imageSchema).optional(),
    status:        Joi.string().valid('available', 'reserved', 'sold').optional(),
    sale_price:    Joi.number().min(0).optional()
}).min(1);

const updateDigitalItemSchema = Joi.object({
    account_email:    Joi.string().email().optional(),
    account_password: Joi.string().min(1).optional(),
    expired_at:       Joi.date().iso().optional().allow(null),
    status:           Joi.string().valid('available', 'sold', 'expired').optional(),
    sale_price:       Joi.number().min(0).optional()
}).min(1);

module.exports = {
    createPhysicalProductSchema,
    createDigitalProductSchema,
    updatePhysicalProductSchema,
    updateDigitalProductSchema,
    updatePhysicalItemSchema,
    updateDigitalItemSchema
};