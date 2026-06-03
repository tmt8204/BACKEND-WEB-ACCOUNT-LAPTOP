const userService = require("../services/user.service");
const ApiResponse = require("../utils/api.response");

class UserController {
    // Get user profile
    async getProfile(req, res, next) {
        try {
            const userId = req.user.id; 
            
            const result = await userService.getProfile({ userId });

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thông tin tài khoản thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // Update user profile
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            const result = await userService.updateProfile(userId, updateData);

            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật thông tin tài khoản thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const userId = req.user.id; // Get user ID from authenticated token
            const { currentPassword, newPassword } = req.body;

            const result = await userService.changePassword({ userId, currentPassword, newPassword });

            return res.status(200).json(
                ApiResponse.success(200, 'Đổi mật khẩu thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();