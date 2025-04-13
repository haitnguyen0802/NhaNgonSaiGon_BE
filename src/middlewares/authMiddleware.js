// Middleware để bảo vệ các route yêu cầu đăng nhập
// Lưu ý: Đây chỉ là mẫu, trong thực tế cần kiểm tra JWT token

exports.protect = async (req, res, next) => {
  try {
    // Lấy token từ header
    let token;
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Kiểm tra xem token có tồn tại không
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.'
      });
    }

    // Xác minh token (giả lập)
    // Lưu ý: Trong thực tế, cần xác minh JWT token
    req.user = { id: 'user-id', role: 'user' };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Không thể xác thực. Vui lòng đăng nhập lại.'
    });
  }
};

// Giới hạn truy cập theo vai trò
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }
    next();
  };
}; 