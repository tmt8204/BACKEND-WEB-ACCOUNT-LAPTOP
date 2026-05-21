const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const jwtUtil = require('../utils/jwt.util');

class AuthService {
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

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user object
      const newUser = {
        fullname,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        address,
        position,
        role
      };

      // Save to database
      const savedUser = await userRepository.createUser(newUser);

      // Generate JWT token (optional, can be returned on login instead)
      const payload = {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role
      };

      const token = jwtUtil.generateToken(payload);

      // Return user data without password
      const userResponse = savedUser.toObject();
      delete userResponse.password;

      return { userResponse, token };
    } catch (error) {
      throw error;
    }
  }

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
      const isMatch = await this.comparePassword(password, user.password);
      if (!isMatch) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        error.errorType = 'Unauthorized';
        throw error;
      }

      // Generate JWT token
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role
      };
      const token = jwtUtil.generateToken(payload);

      // Return user data without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return { userResponse, token };
    } catch (error) {
      throw error;
    }
  }

  async comparePassword(password, hashedPassword) {
    try {
      if (!password || !hashedPassword) {
        throw new Error('Password và hashedPassword không được để trống');
      }
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
