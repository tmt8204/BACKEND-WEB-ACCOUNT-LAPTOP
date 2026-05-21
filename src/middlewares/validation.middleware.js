const ApiResponse = require('../utils/api.response');

const validateRegister = (req, res, next) => {
  const { fullname, email, password, phone, address, position, role } = req.body;
  const errors = [];

  // Validate fullname
  if (!fullname || typeof fullname !== 'string' || fullname.trim() === '') {
    errors.push('Họ tên không được để trống');
  } else if (fullname.trim().length < 3) {
    errors.push('Họ tên phải có ít nhất 3 ký tự');
  }

  // Validate email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email không được để trống');
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Email không hợp lệ');
  }

  // Validate password
  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Mật khẩu không được để trống');
  } else if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  // Validate phone
  if (!phone || phone === '') {
    errors.push('Số điện thoại không được để trống');
  } else if (!/^[0-9]{10}$/.test(phone)) {
    errors.push('Số điện thoại phải có 10 chữ số');
  }

  // Validate address
  if (!address || typeof address !== 'string' || address.trim() === '') {
    errors.push('Địa chỉ không được để trống');
  }

  // Role is optional - will use default 'customer' role if not provided

  // If there are errors, return error response
  if (errors.length > 0) {
    return res.status(400).json(
      ApiResponse.error(400, 'Dữ liệu không hợp lệ', 'Bad Request', errors)
    );
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email không được để trống');
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Email không hợp lệ');
  }

  // Validate password
  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Mật khẩu không được để trống');
  }

  // If there are errors, return error response
  if (errors.length > 0) {
    return res.status(400).json(
      ApiResponse.error(400, 'Dữ liệu không hợp lệ', 'Bad Request', errors)
    );
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
