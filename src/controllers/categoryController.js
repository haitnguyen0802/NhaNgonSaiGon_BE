const { Category, Product, Post } = require('../models/index');
const AppError = require('../utils/errorHandler');
const { Op, Sequelize } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const slugify = require('../utils/slugify');

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res, next) => {
  try {
    const { isActive, sort = 'order', parentCategory } = req.query;
    
    const where = {};
    
    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }
    
    if (parentCategory) {
      if (parentCategory === 'null') {
        where.parent_id = null;
      } else {
        where.parent_id = parentCategory;
      }
    }
    
    let order = [['display_order', 'ASC']]; // Default order
    if (sort && sort !== 'order') {
      order = [[sort, 'ASC']];
    }
    
    const categories = await Category.findAll({
      where,
      order,
      include: [
        { 
          model: Category, 
          as: 'parentCategory', 
          attributes: ['name', 'slug'] 
        }
      ]
    });
    
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
    const category = await Category.findByPk(req.params.id, {
      include: [
        { 
          model: Category, 
          as: 'parentCategory', 
          attributes: ['name', 'slug'] 
        }
      ]
    });
    
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
exports.createCategory = catchAsync(async (req, res, next) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      parent_id, 
      display_order,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!name) {
      req.flash('error', 'Tên danh mục không được để trống');
      return res.redirect('/categories/new');
    }
    
    // Tạo slug nếu không được cung cấp
    const categorySlug = slug || slugify(name);
    
    // Kiểm tra slug đã tồn tại chưa (thêm kiểm tra kỹ lưỡng hơn)
    const existingCategory = await Category.findOne({
      where: { slug: categorySlug }
    });
    
    if (existingCategory) {
      req.flash('error', 'Slug đã được sử dụng, vui lòng chọn một tên khác');
      return res.redirect('/categories/new');
    }
    
    // Xử lý is_active từ checkbox
    const is_active = req.body.is_active === 'on';
    
    // Tạo danh mục mới
    const newCategory = await Category.create({
      name,
      slug: categorySlug,
      description,
      parent_id: parent_id || null,
      display_order: display_order || 0,
      is_active,
      meta_title,
      meta_description,
      meta_keywords
    });
    
    req.flash('success', `Đã tạo danh mục "${name}" thành công`);
    res.redirect('/categories');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/categories/new');
  }
});

// Cập nhật danh mục
exports.updateCategory = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      slug, 
      description, 
      parent_id, 
      display_order,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;
    
    // Tìm danh mục cần cập nhật
    const category = await Category.findByPk(id);
    
    if (!category) {
      req.flash('error', 'Không tìm thấy danh mục');
      return res.redirect('/categories');
    }
    
    // Kiểm tra dữ liệu đầu vào
    if (!name) {
      req.flash('error', 'Tên danh mục không được để trống');
      return res.redirect(`/categories/${id}/edit`);
    }
    
    // Tạo slug mới nếu cần
    let categorySlug = slug;
    if (!categorySlug) {
      categorySlug = slugify(name);
    }
    
    // Kiểm tra slug đã tồn tại chưa (trừ danh mục hiện tại)
    if (categorySlug !== category.slug) {
      const existingCategory = await Category.findOne({
        where: { 
          slug: categorySlug,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingCategory) {
        req.flash('error', 'Slug đã được sử dụng, vui lòng chọn một tên khác');
        return res.redirect(`/categories/${id}/edit`);
      }
    }
    
    // Xử lý is_active từ checkbox
    const is_active = req.body.is_active === 'on';
    
    // Cập nhật danh mục
    await category.update({
      name,
      slug: categorySlug,
      description,
      parent_id: parent_id || null,
      display_order: display_order || 0,
      is_active,
      meta_title,
      meta_description,
      meta_keywords
    });
    
    req.flash('success', `Đã cập nhật danh mục "${name}" thành công`);
    res.redirect('/categories');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/categories/${req.params.id}/edit`);
  }
});

// Xóa danh mục
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return next(new AppError('Không tìm thấy danh mục', 404));
    }
    
    // Kiểm tra xem danh mục có được sử dụng không
    const productCount = await Product.count({ where: { category_id: req.params.id } });
    const postCount = await Post.count({ where: { category_id: req.params.id } });
    const childCategoryCount = await Category.count({ where: { parent_id: req.params.id } });
    
    if (productCount > 0 || postCount > 0 || childCategoryCount > 0) {
      return next(new AppError('Không thể xóa danh mục vì đang được sử dụng', 400));
    }
    
    await category.destroy();
    
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
    // Lấy tất cả danh mục cha (không có parent)
    const parentCategories = await Category.findAll({ 
      where: { parent_id: null },
      order: [['display_order', 'ASC']]
    });
    
    // Lấy tất cả danh mục
    const allCategories = await Category.findAll({
      order: [['display_order', 'ASC']]
    });
    
    // Xây dựng cây danh mục
    const categoryTree = parentCategories.map(parent => {
      return {
        ...parent.toJSON(),
        children: buildCategoryChildren(allCategories, parent.id)
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
    category.parent_id && category.parent_id.toString() === parentId.toString()
  );
  
  return children.map(child => {
    return {
      ...child.toJSON(),
      children: buildCategoryChildren(categories, child.id)
    };
  });
}

// Lấy danh mục theo slug
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ 
      where: { slug: req.params.slug },
      include: [
        { 
          model: Category, 
          as: 'parentCategory', 
          attributes: ['name', 'slug'] 
        }
      ]
    });
    
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

// Hiển thị tất cả danh mục cho trang admin
exports.getAllCategoriesAdmin = catchAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const parentId = req.query.parent || null;
    
    // Xây dựng điều kiện truy vấn
    const where = {};
    
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    
    if (parentId) {
      where.parent_id = parentId;
    }
    
    // Tính offset để phân trang
    const offset = (page - 1) * limit;
    
    // Lấy danh sách tất cả danh mục cha cho dropdown filter
    const parentCategories = await Category.findAll({
      where: {
        parent_id: null
      },
      order: [['name', 'ASC']]
    });
    
    // Lấy danh sách danh mục theo điều kiện (không dùng group và count)
    const { count, rows: categories } = await Category.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'parentCategory',
          attributes: ['id', 'name']
        }
      ],
      order: [['display_order', 'ASC'], ['name', 'ASC']],
      offset,
      limit
    });
    
    // Lấy số lượng bài viết cho mỗi danh mục riêng lẻ
    for (const category of categories) {
      const postCount = await Post.count({
        where: { category_id: category.id }
      });
      category.setDataValue('postCount', postCount);
    }
    
    // Tính tổng số trang
    const totalPages = Math.ceil(count / limit);
    
    res.render('categories/index', {
      title: 'Quản lý danh mục',
      categories,
      parentCategories,
      page,
      limit,
      totalPages,
      query: req.query,
      success: req.flash('success')
    });
  } catch (error) {
    next(error);
  }
});

// Hiển thị form tạo danh mục mới
exports.getNewCategoryForm = catchAsync(async (req, res, next) => {
  try {
    // Lấy danh sách danh mục cha cho dropdown
    const parentCategories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render('categories/new/index', {
      title: 'Thêm danh mục mới',
      parentCategories,
      success: req.flash('success'),
      errors: req.flash('error')
    });
  } catch (error) {
    next(error);
  }
});

// Hiển thị form chỉnh sửa danh mục
exports.getEditCategoryForm = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm danh mục cần chỉnh sửa - không dùng include và count
    const category = await Category.findByPk(id);
    
    if (!category) {
      req.flash('error', 'Không tìm thấy danh mục');
      return res.redirect('/categories');
    }
    
    // Lấy số lượng bài viết cho danh mục này
    const postCount = await Post.count({
      where: { category_id: id }
    });
    category.setDataValue('postCount', postCount);
    
    // Lấy danh sách danh mục cha cho dropdown
    const parentCategories = await Category.findAll({
      where: {
        id: { [Op.ne]: id } // Loại bỏ danh mục hiện tại để tránh self-referencing
      },
      order: [['name', 'ASC']]
    });
    
    // Lấy danh sách danh mục con
    const childCategories = await Category.findAll({
      where: { parent_id: id }
    });
    
    res.render('categories/edit/index', {
      title: `Chỉnh sửa danh mục: ${category.name}`,
      category,
      parentCategories,
      childCategories,
      success: req.flash('success'),
      errors: req.flash('error')
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/categories');
  }
});

// Xóa danh mục
exports.deleteCategory = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm danh mục cần xóa
    const category = await Category.findByPk(id);
    
    if (!category) {
      req.flash('error', 'Không tìm thấy danh mục');
      return res.redirect('/categories');
    }
    
    // Kiểm tra xem có danh mục con không
    const childCategories = await Category.findAll({
      where: { parent_id: id }
    });
    
    if (childCategories.length > 0) {
      req.flash('error', 'Không thể xóa danh mục này vì có danh mục con. Vui lòng xóa các danh mục con trước.');
      return res.redirect('/categories');
    }
    
    // Cập nhật các bài viết thuộc danh mục này (đặt category_id thành null)
    await Post.update(
      { category_id: null },
      { where: { category_id: id } }
    );
    
    // Xóa danh mục
    await category.destroy();
    
    req.flash('success', `Đã xóa danh mục "${category.name}" thành công`);
    res.redirect('/categories');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/categories');
  }
});

// Lấy tất cả danh mục cho API
exports.getAllCategories = catchAsync(async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      include: [
        {
          model: Category,
          as: 'parentCategory',
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['display_order', 'ASC'], ['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Lấy chi tiết danh mục theo slug cho API
exports.getCategoryBySlug = catchAsync(async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({
      where: { 
        slug,
        is_active: true 
      },
      include: [
        {
          model: Category,
          as: 'parentCategory',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Category,
          as: 'childCategories',
          where: { is_active: true },
          required: false
        }
      ]
    });
    
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
}); 