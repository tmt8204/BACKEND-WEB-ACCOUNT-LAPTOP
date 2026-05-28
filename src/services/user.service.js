const userRepository = require("../repositories/user.repository");

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

            if (!user) {
                const error = new Error('Tài khoản không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            if (updateData.phone && updateData.phone !== user.phone) {
                const existingUser = await userRepository.findUserByPhone(updateData.phone);

                if (existingUser) {
                    const error = new Error('Số điện thoại đã được sử dụng');
                    error.statusCode = 400;
                    throw error;
                }
            }

            // Update user data
            const updatedUser = await userRepository.updateUserProfile(userId, updateData);

            const userResponse = updatedUser.toObject();
            delete userResponse.password; // Remove password from response
            delete userResponse.refreshToken; // Remove refresh token from response

            return userResponse;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new UserService();