const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const jwtUtil = require('../utils/jwt.util');
const otpUtil = require('../utils/otp.util');
const mailUtil = require('../utils/mail.util');
const passwordUtil = require('../utils/password.util');

class AuthService {

  //============== REGISTER ==============//
  async register(userData) {
    try {
      let { fullname, email, password, phone, address, position, role } = userData;

      // Check if user already exists by email
      const existingUser = await userRepository.findUserByEmail(email);
      if (existingUser) {
        const error = new Error('Email đã được đăng ký');
        error.statusCode = 400;
        error.errorType = 'Conflict';
        throw error;
      }

      // Check if user already exists by phone number
      const existingPhoneUser = await userRepository.findUserByPhone(phone);
      if (existingPhoneUser) {
        const error = new Error('Số điện thoại đã được đăng ký');
        error.statusCode = 400;
        error.errorType = 'Conflict';
        throw error;
      }

      // If role is not provided, use default 'customer' role
      if (!role) {
        const customerRole = await roleRepository.findRoleByName('customer');
        if (!customerRole) {
          const error = new Error('Role customer không tồn tại. Vui lòng khởi tạo dữ liệu');
          error.statusCode = 500;
          error.errorType = 'Internal Server Error';
          throw error;
        }
        role = customerRole._id;
      }

      // Generate OTP for email verification (optional)
      const otp = otpUtil.generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
      const otpSentAt = new Date();

      // Hash password
      const hashedPassword = await passwordUtil.hashPassword(password);

      // Create user object
      const newUser = {
        fullname,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        address,
        position,
        role,
        otp,
        otpExpiresAt,
        otpSentAt
      };

      // Save to database
      const savedUser = await userRepository.createUser(newUser);

      // Send verification email
      await mailUtil.sendOTP(savedUser.email, savedUser.otp);

      // Return user data without password
      const userResponse = savedUser.toObject();
      delete userResponse.password;

      return { userResponse };
    } catch (error) {
      throw error;
    }
  }

  //============== LOGIN ==============//
  async login(userData) {
    try {
      const { email, password } = userData;

      // Find user by email with password field
      const user = await userRepository.findUserByEmailWithPassword(email);
      if (!user) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        error.errorType = 'Unauthorized';
        throw error;
      }

      // Compare password
      const isMatch = await passwordUtil.comparePassword(password, user.password);
      if (!isMatch) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        error.errorType = 'Unauthorized';
        throw error;
      }

      // Check if user is active
      if (!user.isActive) {
        const error = new Error('Tài khoản của bạn đã bị khóa');
        error.statusCode = 403;
        error.errorType = 'Forbidden';
        throw error;
      }

      // Check if user is verified (if OTP verification is implemented)
      if (!user.isVerified) {
        const error = new Error('Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản');
        error.statusCode = 403;
        error.errorType = 'Forbidden';
        throw error;
      }

      // Generate JWT token
      const userWithRole = await userRepository.findUserById(user._id); // Fetch user with populated role

      const payload = {
        id: user._id,
        email: user.email,
        role: userWithRole.role.name
      };

      const accessToken = jwtUtil.generateAccessToken(payload);
      const refreshToken = jwtUtil.generateRefreshToken(payload);

      // Save refresh token to database
      await userRepository.updateRefreshToken(user._id, refreshToken);

      // Return user data without password
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      return { userResponse, accessToken, refreshToken };
    } catch (error) {
      throw error;
    }
  }


  //============== REFRESH TOKEN ==============//
  async refreshToken(data) {
    try {
      const { refreshToken } = data;

      // Validate input
      if(!refreshToken) {
        const error = new Error('Refresh token không được cung cấp');
        error.statusCode = 400;
        error.errorType = 'Bad Request';
        throw error;
      }      

      // Verify refresh token
      const decoded = jwtUtil.verifyRefreshToken(refreshToken);

      // Find user by ID from token
      const user = await userRepository.findUserById(decoded.id);

      if (!user) {
        const error = new Error('Người dùng không tồn tại');
        error.statusCode = 404;
        error.errorType = 'Not Found';
        throw error;
      }

      // Check if refresh token matches the one in database
      if (user.refreshToken !== refreshToken) {
        const error = new Error('Refresh token không hợp lệ');
        error.statusCode = 401;
        error.errorType = 'Unauthorized';
        throw error;
      }

      // Generate new access token
      const payload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      const newAccessToken = jwtUtil.generateAccessToken(payload);
      const newRefreshToken = jwtUtil.generateRefreshToken(payload);

      // Update refresh token in database
      await userRepository.updateRefreshToken(decoded.id, newRefreshToken);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw error;
    }
  }

  //============== RESET PASSWORD ==============//
  async forgotPassword({ email }) {
    try {

      // Find user by email
      const user = await userRepository.findUserByEmail(email);

      if (!user) {
        const error = new Error('Email không tồn tại');
        error.statusCode = 404;
        error.errorType = 'NotFound';
        throw error;
      }

      // Check spam prevention (e.g., allow request only every 1 minute)
      const now = new Date();
      if (user.resetOtpSentAt && (now - user.resetOtpSentAt) < 1 * 60 * 1000) {
        const error = new Error('Vui lòng đợi 1 phút trước khi yêu cầu đặt lại mật khẩu lần nữa');
        error.statusCode = 429;
        error.errorType = 'TooManyRequests';
        throw error;
      }

      // Generate password reset token (could be a JWT or a random string)
      const resetToken = otpUtil.generateOTP(); // For simplicity, using OTP as reset token
      const resetTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Token expires in 5 minutes

      // Update user with reset token
      user.resetOtp = resetToken;
      user.resetOtpExpiresAt = resetTokenExpiresAt;
      user.resetOtpSentAt = now;
      await user.save();

      // Send password reset email
      await mailUtil.sendOTP(user.email, user.resetOtp);

      return { message: 'Yêu cầu đặt lại mật khẩu thành công. Vui lòng kiểm tra email của bạn' };
    } catch (error) {
      throw error;
    }
  }

  async verifyResetOTP({ email, otp }) {
    try {
      // Find user by email
      const user = await userRepository.findUserByEmail(email);

      // Check if user exists
      if (!user) {
        const error = new Error('Email không tồn tại');
        error.statusCode = 404;
        error.errorType = 'NotFound';
        throw error;
      }

      // Check if OTP matches and is not expired
      if (user.resetOtp !== otp) {
        const error = new Error('OTP không đúng');
        error.statusCode = 400;
        error.errorType = 'BadRequest';
        throw error;
      }

      if (!user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
        // Clear expired OTP
        user.resetOtp = null;
        user.resetOtpExpiresAt = null;
        user.resetOtpSentAt = null;
        await user.save();

        const error = new Error('OTP đã hết hạn');
        error.statusCode = 400;
        error.errorType = 'BadRequest';
        throw error;
      }

      // Mark OTP as verified (you can also set a flag if needed)
      user.isResetVerified = true;
      await user.save();

      return { message: 'Xác thực OTP đặt lại mật khẩu thành công' };
    } catch (error) {
      throw error;
    }
  }


  async resetPassword({ email, newPassword }) {
    try {
      // Find user by email
      const user = await userRepository.findUserByEmail(email);

      // Check if user exists
      if (!user) {
        const error = new Error('Email không tồn tại');
        error.statusCode = 404;
        error.errorType = 'NotFound';
        throw error;
      }

      if (!user.isResetVerified) {
        const error = new Error('Vui lòng xác thực OTP trước khi đặt lại mật khẩu');
        error.statusCode = 400;
        error.errorType = 'BadRequest';
        throw error;
      }

      // Update user's password
      user.password = await passwordUtil.hashPassword(newPassword);
      user.resetOtp = null;
      user.resetOtpExpiresAt = null;
      user.resetOtpSentAt = null;
      user.isResetVerified = false;
      await user.save();

      return { message: 'Đặt lại mật khẩu thành công' };
    } catch (error) {
      throw error;
    }
  }

  //============== OTP ==============//
  async verifyOTP(data) {
    try {
      const { email, otp } = data;

      // Find user by email
      const user = await userRepository.findUserByEmail(email);

      // Check if user exists
      if (!user) {
        const error = new Error('Email không tồn tại');
        error.statusCode = 404;
        error.errorType = 'NotFound';
        throw error;
      }

      // Check if OTP matches and is not expired
      if (user.otp !== otp) {
        const error = new Error('OTP không đúng');
        error.statusCode = 400;
        error.errorType = 'BadRequest';
        throw error;
      }

      // Check if OTP is expired
      if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {

        // Clear expired OTP
        user.otp = null;
        user.otpExpiresAt = null;
        user.otpSentAt = null;
        await user.save();

        const error = new Error('OTP đã hết hạn');
        error.statusCode = 400;
        error.errorType = 'BadRequest';
        throw error;
      }

      // Mark user as verified and clear OTP
      user.isVerified = true;
      user.otp = null;
      user.otpExpiresAt = null;
      user.otpSentAt = null;

      await user.save();

      return { message: 'Xác thực OTP thành công' };
    } catch (error) {
      throw error;
    }
  }

  async sendOTP(data) {
    try {
      const { email } = data;

      // Find user by email
      const user = await userRepository.findUserByEmail(email);

      if(!user) {
        const error = new Error('Email không tồn tại');
        error.statusCode = 404;
        error.errorType = 'NotFound';
        throw error;
      }

      // Check spam prevention (e.g., allow resend only every 1 minute)
      const now = new Date();
      if (user.otpSentAt && (now - user.otpSentAt) < 60 * 1000) {
        const error = new Error('Vui lòng đợi 1 phút trước khi gửi lại OTP');
        error.statusCode = 429;
        error.errorType = 'TooManyRequests';
        throw error;
      }

      // Generate new OTP
      const otp = otpUtil.generateOTP();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes
      const otpSentAt = new Date();

      // Update user with new OTP
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      user.otpSentAt = otpSentAt;
      await user.save();

      // Send verification email
      await mailUtil.sendOTP(user.email, user.otp);

      return { message: 'OTP đã được gửi lại thành công' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
