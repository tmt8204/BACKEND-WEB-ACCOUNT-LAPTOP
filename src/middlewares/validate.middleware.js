const ApiResponse = require('../utils/api.response');

const validate = (schema) => {
  return (req, res, next) => {
    // console.log("BODY", req.body);
    // console.log("STATUS", req.body.status);

    const { error } = schema.validate(req.body, {
      abortEarly: false, 
      stripUnknown: true 
    });

    if (error) {
          // console.log(error.details);

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
