const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageService = require('../utils/imageService');
const AppError = require('../utils/errorHandler');

// Middleware xử lý ảnh sản phẩm
exports.uploadProductImages = (req, res, next) => {
  const upload = imageService.upload.array('images', 10); // Cho phép upload tối đa 10 ảnh
  
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      // Lỗi từ multer
      return res.status(400).json({
        success: false,
        message: err.code === 'LIMIT_FILE_SIZE' 
          ? 'File quá lớn, kích thước tối đa là 5MB' 
          : `Lỗi upload: ${err.message}`
      });
    } else if (err) {
      // Lỗi khác
      return res.status(400).json({
        success: false,
        message: `Lỗi upload: ${err.message}`
      });
    }
    
    // Upload thành công, tiếp tục xử lý
    // Nếu có files, upload lên Cloudinary
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(file => 
          imageService.uploadImage(file.path, 'products')
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        
        // Lưu kết quả vào req để sử dụng trong controller
        req.cloudinaryImages = uploadResults.filter(result => result.success);
        
        if (req.cloudinaryImages.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Không thể upload ảnh lên Cloudinary'
          });
        }
        
        next();
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload ảnh lên Cloudinary'
        });
      }
    } else {
      // Không có file, tiếp tục
      next();
    }
  });
};

// Middleware xử lý ảnh đại diện (single image)
exports.uploadSingleImage = (req, res, next) => {
  const upload = imageService.upload.single('image');
  
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.code === 'LIMIT_FILE_SIZE' 
          ? 'File quá lớn, kích thước tối đa là 5MB' 
          : `Lỗi upload: ${err.message}`
      });
    }
    
    // Upload thành công, tiếp tục xử lý
    if (req.file) {
      try {
        const result = await imageService.uploadImage(req.file.path, 'avatars');
        
        if (result.success) {
          // Lưu kết quả vào req để sử dụng trong controller
          req.cloudinaryImage = result;
          next();
        } else {
          return res.status(400).json({
            success: false,
            message: 'Không thể upload ảnh lên Cloudinary'
          });
        }
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload ảnh lên Cloudinary'
        });
      }
    } else {
      // Không có file, tiếp tục
      next();
    }
  });
};

// API endpoint để upload ảnh trực tiếp
exports.uploadImageAPI = async (req, res) => {
  try {
    const upload = imageService.upload.single('image');
    
    upload(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.code === 'LIMIT_FILE_SIZE' 
            ? 'File quá lớn, kích thước tối đa là 5MB' 
            : `Lỗi upload: ${err.message}`
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Không có file được upload'
        });
      }
      
      try {
        // Upload lên Cloudinary
        const folder = req.query.folder || 'uploads';
        const result = await imageService.uploadImage(req.file.path, folder);
        
        if (result.success) {
          res.status(200).json({
            success: true,
            data: {
              url: result.url,
              public_id: result.public_id
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: result.message || 'Không thể upload ảnh lên Cloudinary'
          });
        }
      } catch (error) {
        console.error('API image upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Lỗi server khi upload ảnh'
        });
      }
    });
  } catch (error) {
    console.error('API image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý upload'
    });
  }
}; 