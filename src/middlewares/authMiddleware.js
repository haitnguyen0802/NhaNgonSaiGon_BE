const jwt = require('jsonwebtoken');
const { AuthKey } = require('../models');

// Middleware để bảo vệ các route yêu cầu đăng nhập
exports.protect = async (req, res, next) => {
  try {
    // Kiểm tra session trước (cho web routes)
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    // Nếu không có session, kiểm tra JWT (cho API routes)
    let token;
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Kiểm tra xem token có tồn tại không
    if (!token) {
      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(401).json({
          success: false,
          message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.'
        });
      }
      return res.redirect('/auth/login');
    }

    // Xác minh token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nhangonsaigon-secret');
      
      // Kiểm tra xem key còn active không
      const activeKey = await AuthKey.findOne({
        where: {
          username: decoded.username,
          isActive: true
        }
      });

      if (!activeKey || new Date() > new Date(activeKey.expiresAt)) {
        throw new Error('Token hết hạn hoặc không hợp lệ');
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }
      return res.redirect('/auth/login');
    }
  } catch (error) {
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(401).json({
        success: false,
        message: 'Không thể xác thực. Vui lòng đăng nhập lại.'
      });
    }
    return res.redirect('/auth/login');
  }
};

// Giới hạn truy cập theo vai trò
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thực hiện hành động này'
        });
      }
      req.flash('error', 'Bạn không có quyền truy cập trang này');
      return res.redirect('/dashboard');
    }
    next();
  };
};

// Middleware để kiểm tra xem người dùng đã đăng nhập chưa
exports.isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    // Nếu đã đăng nhập, chuyển hướng đến trang dashboard
    return res.redirect('/dashboard');
  }
  next();
}; 