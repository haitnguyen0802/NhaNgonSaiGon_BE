const Product = require('../models/Product');
const AppError = require('../utils/errorHandler');
const ProductImage = require('../models/ProductImage');
const imageService = require('../utils/imageService');

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
      description,
      product_mts
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
      productData.category_id = parseInt(category);
    }
    
    // Xử lý mã sản phẩm (product_mts)
    if (product_mts) {
      // Sử dụng mã đã được cung cấp
      productData.product_mts = parseInt(product_mts);
    } else {
      // Tự động tạo mã mới
      try {
        // Tìm mã lớn nhất trong cơ sở dữ liệu
        const maxMtsProduct = await Product.findOne({
          order: [['product_mts', 'DESC']]
        });
        
        // Nếu có sản phẩm, lấy mã lớn nhất và cộng 1, nếu không bắt đầu từ 1
        const nextMts = maxMtsProduct ? parseInt(maxMtsProduct.product_mts) + 1 : 1;
        productData.product_mts = nextMts;
      } catch (error) {
        console.error('Error generating product_mts:', error);
        productData.product_mts = 1; // Mặc định là 1 nếu có lỗi
      }
    }
    
    // Process Cloudinary images
    if (req.cloudinaryImages && req.cloudinaryImages.length > 0) {
      // Use first image as representative
      productData.representative_image = req.cloudinaryImages[0].url;
      // Lưu thêm public_id để có thể xóa ảnh sau này nếu cần
      productData.image_public_id = req.cloudinaryImages[0].public_id;
    }
    
    // Create product in database using Sequelize
    const product = await Product.create(productData);
    
    // Save additional Cloudinary images if any
    if (req.cloudinaryImages && req.cloudinaryImages.length > 1) {
      const imagePromises = req.cloudinaryImages.map((image, index) => {
        // Skip the first image as it's already set as representative_image
        if (index === 0) return null;
        
        return ProductImage.create({
          product_id: product.id,
          image_url: image.url,
          public_id: image.public_id
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
      description,
      product_mts
    } = req.body;
    
    // Prepare product data for update
    const productData = {};
    if (title) productData.title = title;
    if (location !== undefined) productData.location = location || null;
    if (price) productData.price = parseFloat(price);
    if (status) productData.status = status;
    if (description !== undefined) productData.description = description || null;
    
    // Update product_mts if provided
    if (product_mts) {
      productData.product_mts = parseInt(product_mts);
    }
    
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
      productData.category_id = parseInt(category);
    } else if (category === '') {
      console.log('Giữ nguyên category_id cũ vì ràng buộc không cho phép NULL');
    }
    
    // Process Cloudinary images
    if (req.cloudinaryImages && req.cloudinaryImages.length > 0) {
      // Use first image as representative
      productData.representative_image = req.cloudinaryImages[0].url;
      // Lưu thêm public_id để có thể xóa ảnh sau này nếu cần
      productData.image_public_id = req.cloudinaryImages[0].public_id;
      
      // Xử lý các ảnh bổ sung nếu có
      if (req.cloudinaryImages.length > 1) {
        // Xóa các ảnh sản phẩm hiện có
        await ProductImage.destroy({
          where: { product_id: product.id }
        });
        
        // Thêm ảnh mới
        const imagePromises = req.cloudinaryImages.map((image, index) => {
          // Bỏ qua ảnh đầu tiên vì đã đặt là representative_image
          if (index === 0) return null;
          
          return ProductImage.create({
            product_id: product.id,
            image_url: image.url,
            public_id: image.public_id
          });
        }).filter(promise => promise !== null); // Lọc bỏ các giá trị null
        
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