const authService = require('../services/auth.service');
const ApiResponse = require('../utils/api.response');

class AuthController {
  async register(req, res, next) {
    try {
      const { fullname, email, password, phone, address } = req.body;

      // Register user (role will be set to default 'customer' if not provided)
      const user = await authService.register({
        fullname,
        email,
        password,
        phone,
        address
      });

      // Send success response
      return res.status(201).json(
        ApiResponse.success(201, 'Đăng ký tài khoản thành công', user)
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Login user
      const result = await authService.login({ email, password });

      // Send success response with token
      return res.status(200).json(
        ApiResponse.success(200, 'Đăng nhập thành công', { user: result.userResponse, token: result.token })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
