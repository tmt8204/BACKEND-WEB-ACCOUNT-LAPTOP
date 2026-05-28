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
}

module.exports = new UserController();