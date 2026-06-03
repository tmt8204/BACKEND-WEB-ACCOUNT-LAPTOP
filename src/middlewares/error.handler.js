const ApiResponse = require('../utils/api.response');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi server nội bộ';
  const errorType = err.errorType || 'Internal Server Error';

  // Log error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    statusCode,
    message,
    errorType,
    stack: err.stack
  });

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(
      ApiResponse.error(400, 'Dữ liệu không hợp lệ', 'Validation Error', errors)
    );
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} đã được sử dụng`;
    return res.status(400).json(
      ApiResponse.error(400, message, 'Conflict', null)
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      ApiResponse.error(401, 'Token không hợp lệ', 'Unauthorized', null)
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      ApiResponse.error(401, 'Token đã hết hạn', 'Unauthorized', null)
    );
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json(
      ApiResponse.error(400, 'ID không hợp lệ', 'Bad Request', null)
    );
  }

  // Default error response
  res.status(statusCode).json(
    ApiResponse.error(statusCode, message, errorType, null)
  );
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
