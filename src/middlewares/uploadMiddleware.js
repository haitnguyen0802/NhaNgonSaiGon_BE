const multer = require('multer');
const path = require('path');
const AppError = require('../utils/errorHandler');

// Định nghĩa nơi lưu trữ và tên file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(__dirname, '../public/uploads');
    
    // Determine specific folder based on usage
    if (file.fieldname === 'image' && req.baseUrl.includes('/posts')) {
      uploadPath = path.join(__dirname, '../public/img/posts');
    } else if (file.fieldname.includes('Image') || file.fieldname.includes('images')) {
      uploadPath = path.join(__dirname, '../public/img/products');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất: timestamp + tên gốc
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExt}`);
  }
});

// Lọc loại file (chỉ cho phép hình ảnh)
const fileFilter = (req, file, cb) => {
  // Chấp nhận các loại file hình ảnh
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ cho phép tải lên file hình ảnh!', 400), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middleware để xử lý hình ảnh đại diện (1 ảnh)
exports.uploadSingleImage = upload.single('image');

// Middleware for post images - single image
exports.uploadPostImage = upload.single('image');

// Middleware để xử lý hình ảnh sản phẩm - multiple images
exports.uploadProductImages = upload.array('images', 10); // Allow up to 10 images

// Middleware để xử lý hình ảnh bài viết
exports.uploadPostImages = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

// Middleware xử lý lỗi upload
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn, kích thước tối đa là 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`
    });
  }
  
  next(err);
}; 