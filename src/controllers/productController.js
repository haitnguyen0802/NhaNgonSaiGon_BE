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
      // Store only the filename for representative image, not the full path
      productData.representative_image = req.files[0].filename;
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
          image_url: file.filename // Store only the filename
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
    // Find the product by ID
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return next(new AppError('Không tìm thấy sản phẩm', 404));
    }

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
    
    // Prepare product data for update
    const productData = {};
    if (title) productData.title = title;
    if (location !== undefined) productData.location = location || null;
    if (price) productData.price = parseFloat(price);
    if (status) productData.status = status;
    if (description !== undefined) productData.description = description || null;
    
    // Add discount price if provided
    if (discount_price && parseFloat(discount_price) > 0) {
      productData.discount_price = parseFloat(discount_price);
      // Only set status to discounted if it wasn't explicitly provided
      if (!status) {
        productData.status = 'discounted';
      }
    } else if (discount_price === '') {
      productData.discount_price = null;
    }
    
    // Add collaborator if provided
    if (collaborator_id) {
      productData.collaborator_id = parseInt(collaborator_id);
    } else if (collaborator_id === '') {
      productData.collaborator_id = null;
    }
    
    // Add category if provided
    if (category) {
      productData.category = category;
    } else if (category === '') {
      productData.category = null;
    }
    
    // Process uploaded images
    if (req.files && req.files.length > 0) {
      // Store only the filename for representative image
      productData.representative_image = req.files[0].filename;
      
      // Handle additional images if any
      if (req.files.length > 1) {
        // Delete existing product images except representative image
        await ProductImage.destroy({
          where: { product_id: product.id }
        });
        
        // Add new images
        const imagePromises = req.files.map((file, index) => {
          // Skip the first image as it's already set as representative_image
          if (index === 0) return null;
          
          return ProductImage.create({
            product_id: product.id,
            image_url: file.filename // Store only the filename
          });
        }).filter(promise => promise !== null);
        
        if (imagePromises.length > 0) {
          await Promise.all(imagePromises);
        }
      }
    }
    
    // Update the product
    await product.update(productData);
    
    // For API requests, return JSON
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(200).json({
        success: true,
        message: 'Sản phẩm đã được cập nhật thành công',
        data: product
      });
    }
    
    // For web requests, redirect with flash message
    req.flash('success', 'Sản phẩm đã được cập nhật thành công');
    return res.redirect('/products');
    
  } catch (error) {
    console.error('Product update error:', error);
    
    // For API requests, return JSON error
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(500).json({
        success: false,
        message: 'Không thể cập nhật sản phẩm',
        error: error.message
      });
    }
    
    // For web requests, redirect with flash message
    req.flash('error', 'Không thể cập nhật sản phẩm: ' + error.message);
    return res.redirect(`/products/${req.params.id}/edit`);
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res, next) => {
  try {
    // Find the product by ID
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return next(new AppError('Không tìm thấy sản phẩm', 404));
    }

    // Delete related product images
    await ProductImage.destroy({
      where: { product_id: product.id }
    });

    // Delete the product
    await product.destroy();

    // For API requests, return JSON
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(200).json({
        success: true,
        message: 'Sản phẩm đã được xóa thành công'
      });
    }
    
    // For web requests, redirect with flash message
    req.flash('success', 'Sản phẩm đã được xóa thành công');
    return res.redirect('/products');
    
  } catch (error) {
    console.error('Product delete error:', error);
    
    // For API requests, return JSON error
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa sản phẩm',
        error: error.message
      });
    }
    
    // For web requests, redirect with flash message
    req.flash('error', 'Không thể xóa sản phẩm: ' + error.message);
    return res.redirect('/products');
  }
};

// Lấy thống kê tổng quan sản phẩm
exports.getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.count();
    const availableProducts = await Product.count({ 
      where: { status: 'available' } 
    });
    const soldProducts = await Product.count({ 
      where: { status: 'sold' } 
    });
    const discountedProducts = await Product.count({ 
      where: { is_discounted: true } 
    });
    const flashSaleProducts = await Product.count({ 
      where: { is_flash_sale: true } 
    });
    const featuredProducts = await Product.count({ 
      where: { is_featured: true } 
    });
    
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