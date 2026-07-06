const authService = require('../services/auth.service');
const ApiResponse = require('../utils/api.response');

class AuthController {
  async register(req, res, next) {
    try {
      const { fullname, email, password, phone, address } = req.body;

      // Register user (role will be set to default 'customer' if not provided)
      const result = await authService.register({
        fullname,
        email,
        password,
        phone
      });

      // Send success response
      return res.status(201).json(
        ApiResponse.success(201, 'Đăng ký tài khoản thành công', { user: result.userResponse })
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
        ApiResponse.success(200, 'Đăng nhập thành công', { user: result.userResponse, accessToken: result.accessToken, refreshToken: result.refreshToken })
      );
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req, res, next) {
    try {
      const { idToken } = req.body;

      const result = await authService.loginWithGoogle(idToken);

      return res.status(200).json(
        ApiResponse.success(200, 'Đăng nhập bằng Google thành công', {
          user: result.userResponse,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword({ email });

      return res.status(200).json(
        ApiResponse.success(200, 'Yêu cầu đặt lại mật khẩu thành công. Vui lòng kiểm tra email của bạn', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyResetOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      const result = await authService.verifyResetOTP({ email, otp });

      return res.status(200).json(
        ApiResponse.success(200, 'Xác thực OTP đặt lại mật khẩu thành công', result)
      )
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      // Reset password
      const result = await authService.resetPassword({ email, otp, newPassword });

      // Send success response
      return res.status(200).json(
        ApiResponse.success(200, 'Đặt lại mật khẩu thành công', result)
      )
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken({ refreshToken });

      return res.status(200).json(
        ApiResponse.success(200, 'Làm mới token thành công', { accessToken: result.accessToken, refreshToken: result.refreshToken })
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.body;

      const result = await authService.verifyOTP({ email, otp });

      return res.status(200).json(
        ApiResponse.success(200, 'Xác thực OTP thành công', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async sendOTP(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.sendOTP({ email });

      return res.status(200).json(
        ApiResponse.success(200, 'Gửi lại OTP thành công', result)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
