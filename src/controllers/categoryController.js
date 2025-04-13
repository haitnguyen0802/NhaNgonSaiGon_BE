const Category = require('../models/Category');
const Product = require('../models/Product');
const Post = require('../models/Post');
const AppError = require('../utils/errorHandler');

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res, next) => {
  try {
    const { isActive, sort = 'order', parentCategory } = req.query;
    
    const queryObj = {};
    
    if (isActive !== undefined) {
      queryObj.isActive = isActive === 'true';
    }
    
    if (parentCategory) {
      if (parentCategory === 'null') {
        queryObj.parentCategory = null;
      } else {
        queryObj.parentCategory = parentCategory;
      }
    }
    
    const categories = await Category.find(queryObj)
      .sort(sort)
      .populate('parentCategory', 'name slug');
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin một danh mục
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug');
    
    if (!category) {
      return next(new AppError('Không tìm thấy danh mục', 404));
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!category) {
      return next(new AppError('Không tìm thấy danh mục', 404));
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(new AppError('Không tìm thấy danh mục', 404));
    }
    
    // Kiểm tra xem danh mục có được sử dụng không
    const productCount = await Product.countDocuments({ category: req.params.id });
    const postCount = await Post.countDocuments({ category: req.params.id });
    const childCategoryCount = await Category.countDocuments({ parentCategory: req.params.id });
    
    if (productCount > 0 || postCount > 0 || childCategoryCount > 0) {
      return next(new AppError('Không thể xóa danh mục vì đang được sử dụng', 400));
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Danh mục đã được xóa'
    });
  } catch (error) {
    next(error);
  }
};

// Lấy cây danh mục
exports.getCategoryTree = async (req, res, next) => {
  try {
    // Lấy tất cả danh mục cha (không có parentCategory)
    const parentCategories = await Category.find({ parentCategory: null })
      .sort('order');
    
    // Lấy tất cả danh mục
    const allCategories = await Category.find().sort('order');
    
    // Xây dựng cây danh mục
    const categoryTree = parentCategories.map(parent => {
      return {
        ...parent.toObject(),
        children: buildCategoryChildren(allCategories, parent._id)
      };
    });
    
    res.status(200).json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    next(error);
  }
};

// Hàm đệ quy để xây dựng cây danh mục
function buildCategoryChildren(categories, parentId) {
  const children = categories.filter(category => 
    category.parentCategory && category.parentCategory.toString() === parentId.toString()
  );
  
  return children.map(child => {
    return {
      ...child.toObject(),
      children: buildCategoryChildren(categories, child._id)
    };
  });
}

// Lấy danh mục theo slug
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parentCategory', 'name slug');
    
    if (!category) {
      return next(new AppError('Không tìm thấy danh mục', 404));
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}; 