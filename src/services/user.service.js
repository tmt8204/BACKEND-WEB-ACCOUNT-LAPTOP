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

            return userResponse;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserService();