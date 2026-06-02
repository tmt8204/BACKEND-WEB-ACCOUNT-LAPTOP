const bcrypt = require('bcrypt');

const comparePassword = async (password, hashedPassword) => {
    try {
      if (!password || !hashedPassword) {
        throw new Error('Password và hashedPassword không được để trống');
      }
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw error;
    }
};

const hashPassword = async (password) => {
    try {
        if (!password) {
            throw new Error('Password không được để trống');
        }
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw error;
    }
};

module.exports = { comparePassword, hashPassword };