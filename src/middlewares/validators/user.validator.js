const Joi = require('joi');

const updateProfileSchema = Joi.object({
    fullname: Joi.string()
            .min(4)
            .max(50)
            .optional(),
    phone: Joi.string()
            .pattern(/^\d{10,15}$/)
            .optional(),
    address: Joi.string()
            .max(200)
            .optional(),
    position: Joi.string()
            .max(100)
            .optional()
})

module.exports = {
    updateProfileSchema
};