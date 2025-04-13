const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { Product, Collaborator, ProductImage } = require('../models/index');
const { Op } = require('sequelize');

// Lấy thống kê sản phẩm - Public route
router.get('/stats', productController.getProductStats);

// List all products - Web View - Public route
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

// Route to display product creation form
router.get('/create', async (req, res) => {
  try {
    // Get collaborators for the dropdown
    const collaborators = await Collaborator.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    // Get categories for the dropdown (assuming you have a Category model)
    const categories = []; // Replace with actual categories query when available
    
    res.render('products/create', {
      title: 'Thêm sản phẩm mới',
      active: 'products',
      collaborators,
      categories
    });
  } catch (err) {
    console.error('Product creation form error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải form tạo sản phẩm',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// API endpoint to list products - Public route
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

// Route for product detail - Public view
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Collaborator, as: 'collaborator' },
        { model: ProductImage, as: 'images' }
      ]
    });
    
    if (!product) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy sản phẩm',
        error: {}
      });
    }
    
    res.render('products/detail', {
      title: product.title || 'Chi tiết sản phẩm',
      active: 'products',
      product
    });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải chi tiết sản phẩm',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// Route for editing a product
router.get('/:id/edit', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Collaborator, as: 'collaborator' },
        { model: ProductImage, as: 'images' }
      ]
    });
    
    if (!product) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy sản phẩm',
        error: {}
      });
    }
    
    // Get collaborators for the dropdown
    const collaborators = await Collaborator.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    // Get categories for the dropdown (assuming you have a Category model)
    const categories = []; // Replace with actual categories query when available
    
    res.render('products/edit', {
      title: `Chỉnh sửa sản phẩm: ${product.title}`,
      active: 'products',
      product,
      collaborators,
      categories
    });
  } catch (err) {
    console.error('Product edit form error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải form chỉnh sửa sản phẩm',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// Create new product - No auth check needed since user is already logged in
router.post('/',
  uploadMiddleware.uploadProductImages,
  uploadMiddleware.handleUploadError,
  productController.createProduct
);

// Update product - No auth check needed since user is already logged in
router.put('/:id',
  uploadMiddleware.uploadProductImages,
  uploadMiddleware.handleUploadError,
  productController.updateProduct
);

// Delete product - Only check for admin role
router.delete('/:id', 
  authMiddleware.restrictTo('admin'),
  productController.deleteProduct
);

module.exports = router; 