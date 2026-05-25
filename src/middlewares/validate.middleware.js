const ApiResponse = require('../utils/api.response');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, 
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(err => err.message);

      return res.status(400).json(
        ApiResponse.error(
          400,
          'Dữ liệu không hợp lệ',
          'Validation Error',
          errors
        )
      );
    }

    next();
  };
};

module.exports = validate;
