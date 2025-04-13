const Product = require('../models/Product');
const AppError = require('../utils/errorHandler');

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
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
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