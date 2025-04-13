const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { Product, Collaborator, ProductImage } = require('../models/index');
const { Op } = require('sequelize');

// Lấy thống kê sản phẩm
router.get('/stats', productController.getProductStats);

// Các route cần xác thực
router.use(authMiddleware.protect);

// Lấy danh sách sản phẩm và tạo sản phẩm mới
router.route('/')
  .get(productController.getAllProducts)
  .post(
    uploadMiddleware.uploadProductImages,
    uploadMiddleware.handleUploadError,
    productController.createProduct
  );

// Xử lý sản phẩm cụ thể theo ID
router.route('/:id')
  .get(productController.getProductById)
  .put(
    uploadMiddleware.uploadProductImages,
    uploadMiddleware.handleUploadError,
    productController.updateProduct
  )
  .delete(authMiddleware.restrictTo('admin'), productController.deleteProduct);

// List all products
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
      where.title = { [Op.like]: `%${req.query.search}%` };
    }
    
    // Filter by collaborator if specified
    let include = [{ model: Collaborator, as: 'collaborator' }];
    if (req.query.collaborator) {
      include[0].where = { id: req.query.collaborator };
    }
    
    // Get categories for filter dropdown
    const categories = []; // This would be from a categories table
    
    // Get products with filters
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['updated_at', 'DESC']]
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Build query string for pagination
    let queryString = '';
    if (req.query.status) queryString += `&status=${req.query.status}`;
    if (req.query.search) queryString += `&search=${req.query.search}`;
    if (req.query.collaborator) queryString += `&collaborator=${req.query.collaborator}`;
    
    res.render('products/index', {
      title: 'Quản lý sản phẩm',
      active: 'products',
      products,
      categories,
      totalProducts: count,
      currentPage: page,
      totalPages,
      queryString,
      search: req.query.search || '',
      status: req.query.status || '',
      selectedCategory: req.query.category || ''
    });
  } catch (err) {
    console.error('Product listing error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải danh sách sản phẩm',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// API endpoint to list products
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
    
    if (req.query.search) {
      where.title = { [Op.like]: `%${req.query.search}%` };
    }
    
    // Get products with filters
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        { model: Collaborator, as: 'collaborator' },
        { model: ProductImage, as: 'images' }
      ],
      limit,
      offset,
      order: [['updated_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        products,
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