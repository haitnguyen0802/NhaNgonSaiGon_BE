const { Post, Category, Product, User } = require('../models/index');
const AppError = require('../utils/errorHandler');
const { Op, Sequelize } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Lấy tất cả bài đăng với bộ lọc - API
exports.getAllPosts = catchAsync(async (req, res, next) => {
  try {
    const { 
      status, 
      category, 
      product,
      isPinned,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Tạo đối tượng query
    const where = {};

    // Lọc theo trạng thái
    if (status) where.status = status;
    
    // Lọc theo danh mục
    if (category) where.category_id = category;
    
    // Lọc theo sản phẩm
    if (product) where.product_id = product;

    // Tìm kiếm theo tiêu đề
    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }
    
    // Lọc bài bị xóa
    where.is_deleted = false;
    
    // Xử lý sắp xếp
    let order = [];
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';
      
      // Mapping from frontend field names to database field names
      const fieldMap = {
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'pinDate': 'pin_date'
      };
      
      const dbField = fieldMap[sortField] || sortField;
      order.push([dbField, sortDirection]);
    }

    // Tính số lượng bỏ qua
    const offset = (Number(page) - 1) * Number(limit);

    // Thực hiện truy vấn
    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['name', 'slug'] },
        { 
          model: Product, 
          as: 'product',
          attributes: ['title', 'location', 'price', 'status']
        },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] }
      ],
      order,
      offset,
      limit: Number(limit)
    });

    // Phản hồi
    res.status(200).json({
      success: true,
      count: posts.length,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      total: count,
      data: posts
    });
  } catch (error) {
    next(error);
  }
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

// Hiển thị form tạo bài đăng mới
exports.getNewPostForm = catchAsync(async (req, res, next) => {
  try {
    // Get all categories for dropdown
    const categories = await Category.findAll({
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
    
    // Get all categories for dropdown
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    // Get all products for dropdown
    const products = await Product.findAll({
      order: [['title', 'ASC']]
    });
    
    res.render('posts/form', {
      title: 'Chỉnh sửa bài viết',
      active: 'posts',
      post,
      categories,
      products
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
    
    // Add image filename if available
    if (req.file) {
      req.body.representative_image = req.file.filename;
    }

    // Handle is_pinned checkbox
    req.body.is_pinned = req.body.is_pinned === 'true';
    if (req.body.is_pinned) {
      req.body.pin_date = new Date();
    }

    const post = await Post.create(req.body);

    // Redirect to posts list with success message
    req.flash('success', 'Bài viết đã được tạo thành công');
    res.redirect('/posts');
  } catch (error) {
    next(error);
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

    // Add image filename if available
    if (req.file) {
      // Delete old image if exists
      if (post.representative_image) {
        const oldImagePath = path.join(__dirname, '../public/img/posts', post.representative_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      req.body.representative_image = req.file.filename;
    }

    await post.update(req.body);

    // Redirect with success message
    req.flash('success', 'Bài viết đã được cập nhật thành công');
    res.redirect('/posts');
  } catch (error) {
    next(error);
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

exports.resizePostImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Create directory if not exists
  const dir = path.join(__dirname, '../public/img/posts');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Generate unique filename
  req.file.filename = `post-${req.user.id}-${Date.now()}.jpeg`;
  
  // Process and save image
  await sharp(req.file.buffer)
    .resize(1200, 800)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(dir, req.file.filename));

  next();
});

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