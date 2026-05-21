const jwtUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/api.response');

const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json(
        ApiResponse.error(401, 'Token không được cung cấp', 'Unauthorized')
      );
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json(
        ApiResponse.error(401, 'Format token không hợp lệ', 'Unauthorized')
      );
    }

    const token = parts[1];

    // Verify token
    const decoded = jwtUtil.verifyToken(token);
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        ApiResponse.error(401, 'Token đã hết hạn', 'Unauthorized')
      );
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        ApiResponse.error(401, 'Token không hợp lệ', 'Unauthorized')
      );
    }

    return res.status(401).json(
      ApiResponse.error(401, 'Xác thực thất bại', 'Unauthorized')
    );
  }
};

module.exports = {
  verifyToken
};
