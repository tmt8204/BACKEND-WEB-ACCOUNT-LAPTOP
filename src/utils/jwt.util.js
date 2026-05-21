const jwt = require('jsonwebtoken');

class JWTUtil {
    // Generate JWT token
    generateToken = (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET, { 
            expiresIn: process.env.JWT_EXPIRES_IN 
        });
    };

    // Verify JWT token
    verifyToken = (token) => {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw error;
        }
    };
}

module.exports = new JWTUtil();

