const Joi = require('joi');

const imageSchema = Joi.object({
    url: Joi.string().uri().required(),
    public_id: Joi.string().required()
});

const createBannerSchema = Joi.object({
    title: Joi.string().max(150).required(),
    image: imageSchema.required(),
    link_url: Joi.string().uri().optional().allow('', null),
    position: Joi.string().valid('home_top', 'home_middle', 'category_page', 'popup').optional(),
    display_order: Joi.number().integer().optional(),
    is_active: Joi.boolean().optional(),
    start_date: Joi.date().iso().optional().allow(null),
    end_date: Joi.date().iso().optional().allow(null)
});

const updateBannerSchema = Joi.object({
    title: Joi.string().max(150).optional(),
    image: imageSchema.optional(),
    link_url: Joi.string().uri().optional().allow('', null),
    position: Joi.string().valid('home_top', 'home_middle', 'category_page', 'popup').optional(),
    display_order: Joi.number().integer().optional(),
    is_active: Joi.boolean().optional(),
    start_date: Joi.date().iso().optional().allow(null),
    end_date: Joi.date().iso().optional().allow(null)
}).min(1);

module.exports = { createBannerSchema, updateBannerSchema };