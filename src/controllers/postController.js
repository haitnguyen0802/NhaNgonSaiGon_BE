const { Post, Category, Product, User, Collaborator } = require('../models/index');
const AppError = require('../utils/errorHandler');
const { Op, Sequelize } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Lấy tất cả bài đăng với bộ lọc - API
exports.getAllPosts = catchAsync(async (req, res, next) => {
  // Get query parameters
  const { page = 1, limit = 10, sort, status, category, product, search } = req.query;
  
  // Base where clause to exclude deleted posts
  const where = {
    deleted_at: null
  };
  
  // Add filters if provided
  if (status) where.status = status;
  if (category) where.category_id = category;
  if (product) where.product_id = product;
  if (search) {
    where.title = { [Op.like]: `%${search}%` };
  }
  
  // Determine the sort order
  let order = [['created_at', 'DESC']]; // Default sort
  if (sort) {
    const [field, direction] = sort.split(':');
    // Map frontend field names to database field names if needed
    const sortMapping = {
      date: 'created_at',
      title: 'title',
      // Add more mappings as needed
    };
    const dbField = sortMapping[field] || field;
    order = [[dbField, direction.toUpperCase()]];
  }

  // Calculate offset for pagination
  const offset = (page - 1) * limit;
  
  // Query posts with their related category, product, and author
  const { count, rows: posts } = await Post.findAndCountAll({
    where,
    include: [
      { model: Category, as: 'category' },
      { model: Product, as: 'product' },
      { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] }
    ],
    order,
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true
  });
  
  // Calculate total pages
  const totalPages = Math.ceil(count / limit);
  
  // Return response
  res.status(200).json({
    success: true,
    count: posts.length,
    totalPages,
    currentPage: parseInt(page),
    totalCount: count,
    data: posts
  });
});

// Lấy thông tin một bài đăng - API
exports.getPostById = catchAsync(async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category', attributes: ['name', 'slug'] },
        { 
          model: Product, 
          as: 'product',
          attributes: ['title', 'location', 'price', 'status', 'representative_image']
        },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
});

// Hiển thị chi tiết bài đăng cho web view
exports.getPostDetails = catchAsync(async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category', attributes: ['name', 'slug'] },
        { 
          model: Product, 
          as: 'product',
          attributes: ['title', 'location', 'price', 'status', 'representative_image']
        },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }

    // Increment view count
    await post.update({ view_count: post.view_count + 1 });

    // Get related posts
    const relatedPosts = await Post.findAll({
      where: {
        category_id: post.category_id,
        id: { [Op.ne]: post.id },
        status: 'public',
        is_deleted: false
      },
      limit: 3,
      include: [
        { model: Category, as: 'category' }
      ]
    });

    // Get all categories with post count
    const categories = await Category.findAll({
      include: [
        {
          model: Post,
          as: 'posts',
          attributes: ['id'],
          where: { status: 'public', is_deleted: false },
          required: false
        }
      ],
      attributes: {
        include: [
          [Sequelize.fn('COUNT', Sequelize.col('posts.id')), 'postCount']
        ]
      },
      group: ['Category.id']
    });

    res.render('posts/details', {
      title: post.title,
      active: 'posts',
      post,
      relatedPosts,
      categories
    });
  } catch (error) {
    next(error);
  }
});

// Hiển thị trang đăng tin mới
exports.getNewPostPage = catchAsync(async (req, res, next) => {
  try {
    // Get categories for dropdown
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    // Get collaborators for dropdown
    const collaborators = await Collaborator.findAll({
      where: { status: 1 },
      order: [['name', 'ASC']]
    });
    
    // Get products for dropdown with category information
    const products = await Product.findAll({
      where: { status: 'active' },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['title', 'ASC']]
    });
    
    res.render('posts/new/index', {
      title: 'Thêm tin đăng mới',
      active: 'posts',
      categories,
      products,
      collaborators
    });
  } catch (error) {
    next(error);
  }
});

// Hiển thị form tạo bài đăng mới (phiên bản cũ)
exports.getNewPostForm = catchAsync(async (req, res, next) => {
  try {
    // Get all active categories for dropdown
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    // Get all products for dropdown
    const products = await Product.findAll({
      where: { status: 'available' },
      order: [['title', 'ASC']]
    });
    
    res.render('posts/form', {
      title: 'Thêm bài viết mới',
      active: 'posts',
      post: null,
      categories,
      products
    });
  } catch (error) {
    next(error);
  }
});

// Hiển thị form chỉnh sửa bài đăng
exports.getEditPostForm = catchAsync(async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }
    
    // Check if user is author or admin
    if (req.user.role !== 'admin' && post.author_id !== req.user.id) {
      return next(new AppError('Bạn không được phép chỉnh sửa bài đăng này', 403));
    }
    
    // Get all active categories for dropdown
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    // Get all products for dropdown
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['title', 'ASC']]
    });
    
    // Get all collaborators for dropdown
    const collaborators = await Collaborator.findAll({
      where: { status: 1 },
      order: [['name', 'ASC']]
    });
    
    // Get flash messages if any
    const errorMessage = req.flash('error');
    
    res.render('posts/form', {
      title: 'Chỉnh sửa bài viết',
      active: 'posts',
      post,
      categories,
      products,
      collaborators,
      error: errorMessage.length > 0 ? errorMessage[0] : ''
    });
  } catch (error) {
    next(error);
  }
});

// Tạo bài đăng mới
exports.createPost = catchAsync(async (req, res, next) => {
  try {
    // Nếu trạng thái là public, thêm ngày xuất bản
    if (req.body.status === 'public') {
      req.body.publish_date = new Date();
    }

    // Add author if user is logged in
    if (req.user) {
      req.body.author_id = req.user.id;
    }
    
    // Add Cloudinary image URL if available
    if (req.cloudinaryImages && req.cloudinaryImages.length > 0) {
      // Lấy URL của hình ảnh đầu tiên làm hình đại diện
      req.body.representative_image = req.cloudinaryImages[0].url;
      
      // Lưu tất cả URL hình ảnh vào một trường để xử lý sau nếu cần
      req.body.image_urls = req.cloudinaryImages.map(img => img.url).join(',');
    }

    // Handle is_pinned checkbox
    req.body.is_pinned = req.body.is_pinned === 'true';
    if (req.body.is_pinned) {
      req.body.pin_date = new Date();
    }
    
    // Handle empty category_id - if it's an empty string, set it to null
    if (req.body.category_id === '' || req.body.category_id === undefined) {
      req.body.category_id = null;
    } else {
      // Verify the category exists
      const categoryExists = await Category.findByPk(req.body.category_id);
      if (!categoryExists) {
        req.body.category_id = null; // Set to null if category doesn't exist
      }
    }
    
    // Handle empty collaborator_id - if it's an empty string, set it to null
    if (req.body.collaborator_id === '' || req.body.collaborator_id === undefined) {
      req.body.collaborator_id = null;
    } else {
      // Verify the collaborator exists
      const collaboratorExists = await Collaborator.findByPk(req.body.collaborator_id);
      if (!collaboratorExists) {
        req.body.collaborator_id = null; // Set to null if collaborator doesn't exist
      }
    }
    
    // Create post with validated data
    const post = await Post.create(req.body);

    // Redirect to posts list with success message
    req.flash('success', 'Bài viết đã được tạo thành công');
    res.redirect('/posts');
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Get all categories for dropdown
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    // Get all collaborators for dropdown for re-rendering form
    const collaborators = await Collaborator.findAll({
      where: { status: 1 },
      order: [['name', 'ASC']]
    });
    
    // Get all products for dropdown for re-rendering form
    const products = await Product.findAll({
      where: { status: 'available' },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['title', 'ASC']]
    });
    
    // Re-render the form with error message and previously entered data
    res.render('posts/new/index', {
      title: 'Đăng tin mới',
      active: 'posts',
      categories,
      collaborators,
      products,
      error: error.message || 'Có lỗi xảy ra khi tạo bài viết',
      formData: req.body
    });
  }
});

// Cập nhật bài đăng
exports.updatePost = catchAsync(async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }

    // Check if user is author or admin
    if (req.user.role !== 'admin' && post.author_id !== req.user.id) {
      return next(new AppError('Bạn không được phép chỉnh sửa bài đăng này', 403));
    }

    // Nếu cập nhật trạng thái thành public và trước đó không phải public
    if (req.body.status === 'public' && post.status !== 'public') {
      req.body.publish_date = new Date();
    }

    // Handle is_pinned checkbox
    req.body.is_pinned = req.body.is_pinned === 'true';
    if (req.body.is_pinned && !post.is_pinned) {
      req.body.pin_date = new Date();
    } else if (!req.body.is_pinned) {
      req.body.pin_date = null;
    }

    // Add Cloudinary image URL if available
    if (req.cloudinaryImage && req.cloudinaryImage.url) {
      req.body.representative_image = req.cloudinaryImage.url;
    }
    
    // Handle empty category_id - if it's an empty string, set it to null
    if (req.body.category_id === '' || req.body.category_id === undefined) {
      req.body.category_id = null;
    } else {
      // Verify the category exists
      const categoryExists = await Category.findByPk(req.body.category_id);
      if (!categoryExists) {
        req.body.category_id = null; // Set to null if category doesn't exist
      }
    }
    
    // Handle empty collaborator_id - if it's an empty string, set it to null
    if (req.body.collaborator_id === '' || req.body.collaborator_id === undefined) {
      req.body.collaborator_id = null;
    } else {
      // Verify the collaborator exists
      const collaboratorExists = await Collaborator.findByPk(req.body.collaborator_id);
      if (!collaboratorExists) {
        req.body.collaborator_id = null; // Set to null if collaborator doesn't exist
      }
    }

    await post.update(req.body);

    // Redirect with success message
    req.flash('success', 'Bài viết đã được cập nhật thành công');
    res.redirect('/posts');
  } catch (error) {
    console.error('Error updating post:', error);
    
    // Get categories and products for form re-rendering
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['title', 'ASC']]
    });
    
    // Get collaborators for dropdown
    const collaborators = await Collaborator.findAll({
      where: { status: 1 },
      order: [['name', 'ASC']]
    });
    
    // Re-render the form with error message
    res.render('posts/form', {
      title: 'Chỉnh sửa bài viết',
      active: 'posts',
      post: { ...req.body, id: req.params.id },
      categories,
      products,
      collaborators,
      error: error.message || 'Có lỗi xảy ra khi cập nhật bài viết'
    });
  }
});

// Xóa bài đăng
exports.deletePost = catchAsync(async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }

    // Check if user is author or admin
    if (req.user.role !== 'admin' && post.author_id !== req.user.id) {
      return next(new AppError('Bạn không được phép xóa bài đăng này', 403));
    }

    // Soft delete - Cập nhật trạng thái is_deleted
    await post.update({ is_deleted: true });

    // Redirect with success message
    req.flash('success', 'Bài viết đã được xóa thành công');
    res.redirect('/posts');
  } catch (error) {
    next(error);
  }
});

// Thay đổi trạng thái bài đăng
exports.updatePostStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'public'].includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 400));
    }
    
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }
    
    // Nếu chuyển sang public và trước đó không phải public
    if (status === 'public' && post.status !== 'public') {
      post.publish_date = new Date();
    }
    
    post.status = status;
    await post.save();
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Ghim / bỏ ghim bài đăng
exports.togglePinPost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }
    
    const isPinned = req.body.is_pinned === 'true';
    
    post.is_pinned = isPinned;
    post.pin_date = isPinned ? new Date() : null;
    await post.save();
    
    req.flash('success', isPinned ? 'Bài viết đã được ghim' : 'Bài viết đã được bỏ ghim');
    res.redirect('/posts');
  } catch (error) {
    next(error);
  }
};

// Image processing setup
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Không phải hình ảnh! Vui lòng tải lên chỉ hình ảnh.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.uploadPostImage = upload.single('image');

// Admin functionality to list all posts
exports.getPostsAdmin = catchAsync(async (req, res, next) => {
  try {
    // Build query with filters
    const filter = {};
    if (req.query.category) filter.category_id = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    
    // Add search query if provided
    if (req.query.search) {
      filter.title = { [Op.like]: `%${req.query.search}%` };
    }
    
    // Only show non-deleted posts
    filter.is_deleted = false;
    
    // Create options object for pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Get categories for filter dropdown
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    // Execute query with Sequelize
    const { count, rows: posts } = await Post.findAndCountAll({
      where: filter,
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] }
      ],
      limit,
      offset,
      order: [
        ['is_pinned', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
    
    // Render admin template
    res.render('posts/index', {
      title: 'Quản lý bài viết',
      active: 'posts',
      posts,
      categories,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalPosts: count,
      req
    });
  } catch (error) {
    next(error);
  }
});

exports.getPostStats = catchAsync(async (req, res) => {
  const stats = await Post.findAll({
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['status']
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
}); 