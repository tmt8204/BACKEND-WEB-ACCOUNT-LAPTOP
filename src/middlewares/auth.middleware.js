const jwtUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/api.response');
const roleRepository = require('../repositories/role.repository');

const authenticate = (req, res, next) => {
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
    const decoded = jwtUtil.verifyAccessToken(token);
    
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

const authorizeRoles = (allowedRoles) => async (req, res, next) => {
  try {
    //console.log('User role from token:', req.user.role);
    console.log('User role:', req.user.role);
    console.log('Allowed roles:', allowedRoles);

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(
            ApiResponse.error(403, 'Bạn không có quyền truy cập tài nguyên này', 'Forbidden')
        );
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorizeRoles
};
