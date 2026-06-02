const userRepository = require("../repositories/user.repository");
const passwordUtil = require("../utils/password.util");
const bcrypt = require('bcrypt');

class UserService {
    async getProfile(data) {
        try {
            const { userId } = data;

            const user = await userRepository.findUserById(userId);

            if (!user) {
                const error = new Error('Tài khoản không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            const userResponse = user.toObject();
            delete userResponse.password; // Remove password from response
            delete userResponse.refreshToken; // Remove refresh token from response

            return userResponse;
        } catch (error) {
            throw error;
        }
    }

    // Update user profile
    async updateProfile(userId, updateData) {
        try {
            const user = await userRepository.findUserById(userId);

            // Check if user exists
            if (!user) {
                const error = new Error('Tài khoản không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            // If phone number is being updated, check for uniqueness
            if (updateData.phone && updateData.phone !== user.phone) {
                const existingUser = await userRepository.findUserByPhone(updateData.phone);

                if (existingUser) {
                    const error = new Error('Số điện thoại đã được sử dụng');
                    error.statusCode = 400;
                    throw error;
                }
            }

            // Only allow certain fields to be updated
            const allowedFields = ['fullname', 'phone', 'address', 'position'];
            const safeData = {};

            // Update user data
            for (const field of allowedFields) {
                if (updateData[field]) {
                    safeData[field] = updateData[field];
                }
            }

            if (Object.keys(safeData).length === 0) {
                const error = new Error('Không có trường nào để cập nhật');
                error.statusCode = 400;
                throw error;
            }

            const updatedUser = await userRepository.updateUserProfile(userId, safeData);

            // Prepare response without sensitive data
            const userResponse = updatedUser.toObject();
            delete userResponse.password; // Remove password from response
            delete userResponse.refreshToken; // Remove refresh token from response

            return userResponse;
        } catch (error) {
            throw error;
        }
    }

    async changePassword(data) {
        try {
            // Extract user ID from data (you can also pass it as a separate parameter if needed)
            const { userId, currentPassword, newPassword } = data;

            // Find user by ID
            const user = await userRepository.findUserById(userId);

            // Check if user exists
            if (!user) {
                const error = new Error('Tài khoản không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            // Compare current password
            const isMatch = await passwordUtil.comparePassword(currentPassword, user.password);
            if (!isMatch) {
                const error = new Error('Mật khẩu hiện tại không đúng');
                error.statusCode = 400;
                throw error;
            }

            // Hash new password and update
            const newHashedPassword = await passwordUtil.hashPassword(newPassword);
            await userRepository.updateUserProfile(userId, { password: newHashedPassword });

            // Return success message
            return { message: 'Đổi mật khẩu thành công' };
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new UserService();