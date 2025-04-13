const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuth, isAdmin } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { Category } = require('../models/index');
const { Op } = require('sequelize');

// ==================== Admin Routes (Protected) ====================
// Trang danh sách quản lý danh mục
router.get('/', isAuth, isAdmin, categoryController.getAllCategoriesAdmin);

// Trang tạo danh mục mới
router.get('/new', isAuth, isAdmin, categoryController.getNewCategoryForm);
router.post('/new', isAuth, isAdmin, categoryController.createCategory);

// Trang chỉnh sửa danh mục
router.get('/:id/edit', isAuth, isAdmin, categoryController.getEditCategoryForm);
router.post('/:id/edit', isAuth, isAdmin, categoryController.updateCategory);

// Xóa danh mục
router.post('/:id/delete', isAuth, isAdmin, categoryController.deleteCategory);

// ==================== Public API Routes ====================
// Lấy tất cả danh mục
router.get('/api', categoryController.getAllCategories);

// Lấy danh mục theo slug
router.get('/api/:slug', categoryController.getCategoryBySlug);

// API công khai
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);

// Các route cần xác thực
router.use(isAuth);
router.use(isAdmin);

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