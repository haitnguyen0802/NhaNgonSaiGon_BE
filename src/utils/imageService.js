const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Cấu hình Cloudinary nếu chưa được cấu hình ở nơi khác
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Cấu hình multer để lưu tệp tạm
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Kiểm tra loại tệp
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
};

// Tạo middleware multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // giới hạn 5MB
  }
});

/**
 * Upload một ảnh lên Cloudinary
 * @param {String} filePath - Đường dẫn đến file
 * @param {String} folder - Thư mục trên Cloudinary
 * @returns {Promise} - Kết quả từ Cloudinary
 */
const uploadImage = async (filePath, folder = 'products') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      resource_type: 'image'
    });
    
    // Xóa file tạm sau khi upload
    fs.unlinkSync(filePath);
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Lỗi khi upload ảnh lên Cloudinary:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Xóa một ảnh khỏi Cloudinary
 * @param {String} publicId - Public ID của ảnh trên Cloudinary
 * @returns {Promise} - Kết quả từ Cloudinary
 */
const deleteImage = async (publicId) => {
  if (!publicId) return { success: false, message: 'Public ID không hợp lệ' };
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      message: result.result
    };
  } catch (error) {
    console.error('Lỗi khi xóa ảnh từ Cloudinary:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Tối ưu URL ảnh Cloudinary
 * @param {String} url - URL gốc của ảnh
 * @param {Object} options - Tùy chọn biến đổi
 * @returns {String} - URL đã được tối ưu
 */
const optimizeImageUrl = (url, options = {}) => {
  if (!url || !url.includes('cloudinary')) return url;
  
  const defaultOptions = {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Thêm các chuyển đổi vào URL
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  const transformations = [
    `w_${opts.width}`,
    `h_${opts.height}`,
    `c_${opts.crop}`,
    `q_${opts.quality}`,
    `f_${opts.format}`
  ].join(',');
  
  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
};

module.exports = {
  upload,
  uploadImage,
  deleteImage,
  optimizeImageUrl
}; 