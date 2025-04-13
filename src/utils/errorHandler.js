/**
 * Lớp AppError mở rộng từ Error
 * Dùng để tạo các lỗi ứng dụng với thông tin bổ sung
 */
class AppError extends Error {
  /**
   * Khởi tạo lỗi ứng dụng mới
   * @param {string} message - Thông báo lỗi
   * @param {number} statusCode - Mã trạng thái HTTP
   */
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    // Tạo stack trace cho đối tượng
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError; 