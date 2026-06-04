const Joi = require('joi');

const createPhysicalProductSchema = Joi.object({
    productData: Joi.object({
        name: Joi.string().min(3).max(100).required(),
        description: Joi.string().max(500).allow('').optional(),
        base_price: Joi.number().min(0).required()
    }).required(),
    physicalData: Joi.object({
        brand: Joi.string().required(),
        model: Joi.string().required(),
        weight_kg: Joi.number().min(0).required(),
        cpu: Joi.string().required(),
        gpu: Joi.string().required(),
        ram: Joi.string().required(),
        storage: Joi.string().required(),
        display_inches: Joi.number().min(0).required(),
        os: Joi.string().required(),
        condition_percent: Joi.number().min(0).max(100).required(),
        warranty_months: Joi.number().min(0).required(),
        important_price: Joi.number().min(0).required()
    }).required(),
    itemData: Joi.object({
        serial_number: Joi.string().required(),
        images_urls: Joi.array().items(Joi.string().uri()),
        status: Joi.string().valid('available', 'reserved', 'sold'),
        sale_price: Joi.number().min(0).required()
    }).required()
});

const createDigitalProductSchema = Joi.object({
    productData: Joi.object({
        name:        Joi.string().min(3).max(100).required(),
        description: Joi.string().max(500).allow('').optional(),
        base_price:  Joi.number().min(0).required()
    }).required(),

    digitalData: Joi.object({
        platform:      Joi.string().required(),          // 'Netflix', 'Spotify'
        category:      Joi.string().required(),          // 'Streaming', 'Music'
        region:        Joi.string().required(),          // 'VN', 'Global'
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

module.exports = { 
    createPhysicalProductSchema,
    createDigitalProductSchema
};