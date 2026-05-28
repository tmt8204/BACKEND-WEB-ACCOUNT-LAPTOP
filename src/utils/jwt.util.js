const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTUtil {
    // Generate JWT token
    generateAccessToken = (payload) => {
        return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { 
            expiresIn: process.env.JWT_ACCESS_EXPIRES
        });
    };

    generateRefreshToken = (payload) => {
        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
            expiresIn: process.env.JWT_REFRESH_EXPIRES
        });
    };

    // Verify JWT token
    verifyAccessToken = (token) => {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (error) {
            throw error;
        }
    };

    verifyRefreshToken = (token) => {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw error;
        }
    };
}

module.exports = new JWTUtil();

