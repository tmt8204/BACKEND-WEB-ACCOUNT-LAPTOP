const User = require('../models/user.model');

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
      const user = await User.findById(id).populate('role');
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserRepository();
