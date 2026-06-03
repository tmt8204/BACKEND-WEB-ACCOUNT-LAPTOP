class ApiResponse {
  static success(statusCode, message, data = null) {
    return {
      success: true,
      statusCode,
      message,
      data
    };
  }

  static error(statusCode, message, error = 'Bad Request', errors = null) {
    return {
      success: false,
      statusCode,
      message,
      error,
      errors
    };
  }
}

module.exports = ApiResponse;
