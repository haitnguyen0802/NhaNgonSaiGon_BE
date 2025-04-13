// Hàm kiểm tra dữ liệu đầu vào cho đăng ký
exports.validateRegister = (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const errors = [];

  // Kiểm tra tên
  if (!name || name.trim() === '') {
    errors.push('Tên là bắt buộc');
  }

  // Kiểm tra email
  if (!email || email.trim() === '') {
    errors.push('Email là bắt buộc');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Email không hợp lệ');
    }
  }

  // Kiểm tra mật khẩu
  if (!password) {
    errors.push('Mật khẩu là bắt buộc');
  } else if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  // Kiểm tra xác nhận mật khẩu
  if (password !== passwordConfirm) {
    errors.push('Mật khẩu xác nhận không khớp');
  }

  // Nếu có lỗi, trả về lỗi
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  // Nếu không có lỗi, tiếp tục
  next();
};

// Hàm kiểm tra dữ liệu đầu vào cho đăng nhập
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Kiểm tra email
  if (!email || email.trim() === '') {
    errors.push('Email là bắt buộc');
  }

  // Kiểm tra mật khẩu
  if (!password) {
    errors.push('Mật khẩu là bắt buộc');
  }

  // Nếu có lỗi, trả về lỗi
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  // Nếu không có lỗi, tiếp tục
  next();
}; 