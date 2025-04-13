const Product = require('../models/Product');
const AppError = require('../utils/errorHandler');
const ProductImage = require('../models/ProductImage');

// Lấy tất cả sản phẩm với các bộ lọc
exports.getAllProducts = async (req, res, next) => {
  try {
    const { 
      status, 
      category, 
      collaborator, 
      isFeatured, 
      isDiscounted, 
      isFlashSale,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Tạo đối tượng query
    const queryObj = {};

    // Lọc theo trạng thái
    if (status) queryObj.status = status;
    
    // Lọc theo danh mục
    if (category) queryObj.category = category;
    
    // Lọc theo CTV
    if (collaborator) queryObj.collaborator = collaborator;
    
    // Lọc theo tính năng nổi bật
    if (isFeatured) queryObj.isFeatured = isFeatured === 'true';
    
    // Lọc theo giảm giá
    if (isDiscounted) queryObj.isDiscounted = isDiscounted === 'true';
    
    // Lọc theo flash sale
    if (isFlashSale) queryObj.isFlashSale = isFlashSale === 'true';
    
    // Lọc theo khoảng giá
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }
    
    // Tìm kiếm theo tên
    if (search) {
      queryObj.name = { $regex: search, $options: 'i' };
    }

    // Tính số lượng bỏ qua
    const skip = (Number(page) - 1) * Number(limit);

    // Thực hiện truy vấn
    const query = Product.find(queryObj)
      .populate('category', 'name slug')
      .populate('collaborator', 'name phoneNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Thực hiện truy vấn đếm tổng số
    const total = await Product.countDocuments(queryObj);
    
    // Lấy kết quả
    const products = await query;

    // Phản hồi
    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin một sản phẩm
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('collaborator', 'name phoneNumber');

    if (!product) {
      return next(new AppError('Không tìm thấy sản phẩm', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res, next) => {
  try {
    // Extract data from request body
    const { 
      title, 
      location, 
      price, 
      discount_price, 
      status, 
      collaborator_id, 
      category,
      description 
    } = req.body;
    
    // Prepare product data
    const productData = {
      title,
      location: location || null,
      price: parseFloat(price),
      status: status || 'available',
      description: description || null
    };
    
    // Add discount price if provided
    if (discount_price && parseFloat(discount_price) > 0) {
      productData.discount_price = parseFloat(discount_price);
      // Automatically set status to discounted if there's a discount price
      productData.status = 'discounted';
    }
    
    // Add collaborator if provided
    if (collaborator_id) {
      productData.collaborator_id = parseInt(collaborator_id);
    }
    
    // Add category if provided
    if (category) {
      productData.category = category;
    }
    
    // Process uploaded images
    if (req.files && req.files.length > 0) {
      // Set representative image (first image)
      productData.representative_image = req.files[0].path.replace(/\\/g, '/');
    }
    
    // Create product in database using Sequelize
    const product = await Product.create(productData);
    
    // Save additional images if any
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
        // Skip the first image as it's already set as representative_image
        if (index === 0) return null;
        
        return ProductImage.create({
          product_id: product.id,
          image_url: file.path.replace(/\\/g, '/')
        });
      }).filter(promise => promise !== null); // Filter out nulls
      
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
      }
    }
    
    // For API requests, return JSON
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(201).json({
        success: true,
        message: 'Sản phẩm đã được tạo thành công',
        data: product
      });
    }
    
    // For web requests, redirect with flash message
    req.flash('success', 'Sản phẩm đã được tạo thành công');
    return res.redirect('/products');
    
  } catch (error) {
    console.error('Product creation error:', error);
    
    // For API requests, return JSON error
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(500).json({
        success: false,
        message: 'Không thể tạo sản phẩm',
        error: error.message
      });
    }
    
    // For web requests, redirect with flash message
    req.flash('error', 'Không thể tạo sản phẩm: ' + error.message);
    return res.redirect('/products/create');
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return next(new AppError('Không tìm thấy sản phẩm', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return next(new AppError('Không tìm thấy sản phẩm', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Sản phẩm đã được xóa'
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê tổng quan sản phẩm
exports.getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ status: 'available' });
    const soldProducts = await Product.countDocuments({ status: 'sold' });
    const discountedProducts = await Product.countDocuments({ isDiscounted: true });
    const flashSaleProducts = await Product.countDocuments({ isFlashSale: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        availableProducts,
        soldProducts,
        discountedProducts,
        flashSaleProducts,
        featuredProducts
      }
    });
  } catch (error) {
    next(error);
  }
}; 