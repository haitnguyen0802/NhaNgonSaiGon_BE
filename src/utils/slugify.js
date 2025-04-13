/**
 * Chuyển đổi chuỗi thành slug URL thân thiện
 * - Chuyển đổi chữ có dấu thành không dấu
 * - Thay thế khoảng trắng bằng dấu gạch ngang
 * - Loại bỏ ký tự đặc biệt
 * - Chuyển tất cả thành chữ thường
 * 
 * @param {string} text - Văn bản cần chuyển đổi thành slug
 * @returns {string} Slug URL thân thiện
 */
function slugify(text) {
  if (!text) return '';
  
  // Chuyển đổi sang chữ thường
  let str = text.toLowerCase();
  
  // Bảng chuyển đổi dấu tiếng Việt
  str = str
    // Chữ có dấu -> không dấu
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    
    // Loại bỏ ký tự đặc biệt
    .replace(/[^a-z0-9\s-]/g, '')
    
    // Thay thế khoảng trắng bằng dấu gạch ngang
    .replace(/\s+/g, '-')
    
    // Loại bỏ dấu gạch ngang liên tiếp
    .replace(/-+/g, '-')
    
    // Loại bỏ dấu gạch ngang ở đầu và cuối
    .replace(/^-+|-+$/g, '');
  
  return str;
}

module.exports = slugify; 