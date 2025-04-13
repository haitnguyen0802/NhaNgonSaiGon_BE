const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { Post, Product } = require('../models/index');
const { Op } = require('sequelize');

// API công khai
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// Các route cần xác thực
router.use(authMiddleware.protect);

// Tạo bài đăng mới
router.post('/', 
  uploadMiddleware.uploadPostImages,
  uploadMiddleware.handleUploadError,
  postController.createPost
);

// Xử lý bài đăng cụ thể theo ID
router.route('/:id')
  .put(
    uploadMiddleware.uploadPostImages,
    uploadMiddleware.handleUploadError,
    postController.updatePost
  )
  .delete(postController.deletePost);

// Thay đổi trạng thái bài đăng
router.patch('/:id/status', authMiddleware.restrictTo('admin'), postController.updatePostStatus);

// Ghim / bỏ ghim bài đăng
router.patch('/:id/pin', authMiddleware.restrictTo('admin'), postController.togglePinPost);

// List all posts
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const where = {};
    
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.search) {
      // This would typically search in post title/content, but we'll adapt to the database structure
      where.category = { [Op.like]: `%${req.query.search}%` };
    }
    
    // Get posts with filters
    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product' }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Build query string for pagination
    let queryString = '';
    if (req.query.status) queryString += `&status=${req.query.status}`;
    if (req.query.search) queryString += `&search=${req.query.search}`;
    if (req.query.category) queryString += `&category=${req.query.category}`;
    
    // Mock categories for filter dropdown
    const categories = [
      { id: 1, name: 'Tin tức' },
      { id: 2, name: 'Khuyến mãi' },
      { id: 3, name: 'Sự kiện' },
      { id: 4, name: 'Thông báo' }
    ];
    
    res.render('posts/index', {
      title: 'Quản lý tin đăng',
      active: 'posts',
      posts,
      categories,
      totalPosts: count,
      currentPage: page,
      totalPages,
      queryString,
      search: req.query.search || '',
      status: req.query.status || '',
      selectedCategory: req.query.category || ''
    });
  } catch (err) {
    console.error('Post listing error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải danh sách tin đăng',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// API endpoint to list posts
router.get('/api', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const where = {};
    
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.category) {
      where.category = req.query.category;
    }
    
    // Get posts with filters
    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product' }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 