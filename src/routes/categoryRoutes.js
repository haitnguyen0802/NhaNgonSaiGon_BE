const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { Category } = require('../models/index');
const { Op } = require('sequelize');

// API công khai
router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Các route cần xác thực
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Tạo danh mục mới
router.post('/', 
  uploadMiddleware.uploadSingleImage,
  uploadMiddleware.handleUploadError,
  categoryController.createCategory
);

// Xử lý danh mục cụ thể theo ID
router.route('/:id')
  .put(
    uploadMiddleware.uploadSingleImage,
    uploadMiddleware.handleUploadError,
    categoryController.updateCategory
  )
  .delete(categoryController.deleteCategory);

// List all categories
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get all categories
    const { count, rows: categories } = await Category.findAndCountAll({
      limit,
      offset,
      include: [
        { model: Category, as: 'parent' }
      ],
      order: [['id', 'ASC']]
    });
    
    // Get all parent categories for the dropdown
    const parentCategories = await Category.findAll({
      where: {
        parent_id: null
      }
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    const queryString = req.query.search ? `&search=${req.query.search}` : '';
    
    res.render('categories/index', {
      title: 'Quản lý danh mục',
      active: 'categories',
      categories,
      parentCategories,
      totalCategories: count,
      currentPage: page,
      totalPages,
      queryString
    });
  } catch (err) {
    console.error('Category listing error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải danh sách danh mục',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// API endpoint to list categories
router.get('/api', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: Category, as: 'parent' }
      ],
      order: [['id', 'ASC']]
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 