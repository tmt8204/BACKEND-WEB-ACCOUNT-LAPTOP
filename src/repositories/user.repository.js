const User = require('../models/user.model');
const roleRepository = require('./role.repository');

class UserRepository {
  async createUser(userData) {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      return savedUser;
    } catch (error) {
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findUserByEmailWithPassword(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findUserByPhone(phone) {
    try {
      const user = await User.findOne({ phone: phone });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findUserById(id) {
    try {
      const user = await User.findById(id).populate('role').select('+password');
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateRefreshToken(userId, refreshToken) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { refreshToken: refreshToken },
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async findUserByGoogleId(googleId) {
    try {
      const user = await User.findOne({ googleId: googleId });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findByRoleId(roleId) {
    try {
      const users = await User.find({ role: roleId });
      return users;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserRepository();
