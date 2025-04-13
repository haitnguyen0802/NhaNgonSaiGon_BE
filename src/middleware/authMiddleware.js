const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const AppError = require('../utils/errorHandler');
const catchAsync = require('../utils/catchAsync');

/**
 * Kiểm tra xem người dùng đã đăng nhập hay chưa
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.isAuth = catchAsync(async (req, res, next) => {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!req.user) {
    // Trong môi trường phát triển, chúng ta có một người dùng giả mạo
    if (process.env.NODE_ENV !== 'production') {
      next();
      return;
    }
    
    // Nếu là một yêu cầu API, trả về lỗi JSON
    if (req.xhr || req.path.startsWith('/api')) {
      return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
    }
    
    // Redirect đến trang đăng nhập cho giao diện web
    req.flash('error', 'Bạn cần đăng nhập để truy cập trang này.');
    return res.redirect('/auth/login');
  }
  
  next();
});

/**
 * Hạn chế truy cập các tuyến đường chỉ dành cho quản trị viên
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.isAdmin = catchAsync(async (req, res, next) => {
  // Kiểm tra xem người dùng có quyền quản trị viên không
  if (req.user && req.user.role !== 'admin') {
    // Nếu là một yêu cầu API, trả về lỗi JSON
    if (req.xhr || req.path.startsWith('/api')) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này.', 403));
    }
    
    // Redirect đến trang chủ hoặc dashboard cho giao diện web
    req.flash('error', 'Bạn không có quyền truy cập trang này.');
    return res.redirect('/dashboard');
  }
  
  next();
}); 