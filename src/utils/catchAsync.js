/**
 * Hàm bao bọc hàm xử lý controller không đồng bộ để bắt lỗi
 * Giúp tránh việc phải sử dụng try/catch lặp đi lặp lại trong các controller
 * 
 * @param {Function} fn - Hàm xử lý không đồng bộ
 * @returns {Function} Middleware Express đã được bao bọc để bắt lỗi
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}; 