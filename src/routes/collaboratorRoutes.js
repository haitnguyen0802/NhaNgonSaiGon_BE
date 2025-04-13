const express = require('express');
const router = express.Router();
const { Collaborator, Product } = require('../models/index');
const { Op } = require('sequelize');

// List all collaborators
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const where = {};
    
    if (req.query.status) {
      where.is_active = req.query.status === 'active';
    }
    
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { phone: { [Op.like]: `%${req.query.search}%` } }
      ];
    }
    
    // Get collaborators with product counts
    const { count, rows: collaborators } = await Collaborator.findAndCountAll({
      where,
      limit,
      offset,
      distinct: true,
      order: [['id', 'ASC']],
      include: [
        { model: Product, as: 'products', required: false }
      ]
    });
    
    // Add product count property to each collaborator
    const collaboratorsWithCounts = collaborators.map(collaborator => {
      const data = collaborator.toJSON();
      data.productCount = data.products ? data.products.length : 0;
      return data;
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Build query string for pagination
    let queryString = '';
    if (req.query.status) queryString += `&status=${req.query.status}`;
    if (req.query.search) queryString += `&search=${req.query.search}`;
    
    res.render('collaborators/index', {
      title: 'Quản lý cộng tác viên',
      active: 'collaborators',
      collaborators: collaboratorsWithCounts,
      totalCollaborators: count,
      currentPage: page,
      totalPages,
      queryString,
      search: req.query.search || '',
      status: req.query.status || ''
    });
  } catch (err) {
    console.error('Collaborator listing error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải danh sách cộng tác viên',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// Get single collaborator
router.get('/:id', async (req, res) => {
  try {
    const collaborator = await Collaborator.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'products' }
      ]
    });
    
    if (!collaborator) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy cộng tác viên',
        error: {}
      });
    }
    
    res.render('collaborators/detail', {
      title: `Cộng tác viên: ${collaborator.name}`,
      active: 'collaborators',
      collaborator,
      productCount: collaborator.products ? collaborator.products.length : 0
    });
  } catch (err) {
    console.error('Collaborator detail error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải thông tin cộng tác viên',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// API endpoint to list collaborators
router.get('/api', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const where = {};
    
    if (req.query.status) {
      where.is_active = req.query.status === 'active';
    }
    
    // Get collaborators with product counts
    const { count, rows: collaborators } = await Collaborator.findAndCountAll({
      where,
      limit,
      offset,
      distinct: true,
      include: [
        { model: Product, as: 'products', required: false }
      ],
      order: [['id', 'ASC']]
    });
    
    // Add product count property to each collaborator
    const collaboratorsWithCounts = collaborators.map(collaborator => {
      const data = collaborator.toJSON();
      data.productCount = data.products ? data.products.length : 0;
      return data;
    });
    
    res.json({
      success: true,
      data: {
        collaborators: collaboratorsWithCounts,
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