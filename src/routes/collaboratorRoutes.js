const express = require('express');
const router = express.Router();
const { Collaborator, Product } = require('../models/index');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/collaborators');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh có định dạng jpeg, jpg, png hoặc gif!'));
  }
});

// List all collaborators
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

// Create new collaborator form
router.get('/new', async (req, res) => {
  try {
    res.render('collaborators/new', {
      title: 'Thêm cộng tác viên mới',
      active: 'collaborators'
    });
  } catch (err) {
    console.error('Collaborator new form error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải form thêm cộng tác viên',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// Store new collaborator
router.post('/new', upload.single('avatar'), async (req, res) => {
  try {
    // Prepare create data
    const createData = {
      name: req.body.name,
      phone: req.body.phone,
      status: req.body.status
    };
    
    // Handle avatar upload
    if (req.file) {
      createData.avatar = '/uploads/collaborators/' + req.file.filename;
    }
    
    // Create collaborator
    const collaborator = await Collaborator.create(createData);
    
    req.flash('success', 'Thêm cộng tác viên mới thành công');
    res.redirect(`/collaborators/${collaborator.id}`);
  } catch (err) {
    console.error('Collaborator create error:', err);
    req.flash('error', 'Có lỗi xảy ra khi thêm cộng tác viên mới: ' + err.message);
    res.redirect('/collaborators/new');
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

// Edit collaborator page
router.get('/:id/edit', async (req, res) => {
  try {
    const collaborator = await Collaborator.findByPk(req.params.id);
    
    if (!collaborator) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy cộng tác viên',
        error: {}
      });
    }
    
    res.render('collaborators/edit', {
      title: `Chỉnh sửa cộng tác viên: ${collaborator.name}`,
      active: 'collaborators',
      collaborator
    });
  } catch (err) {
    console.error('Collaborator edit error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải thông tin cộng tác viên',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// Update collaborator
router.post('/:id/edit', upload.single('avatar'), async (req, res) => {
  try {
    const collaborator = await Collaborator.findByPk(req.params.id);
    
    if (!collaborator) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy cộng tác viên',
        error: {}
      });
    }
    
    // Prepare update data
    const updateData = {
      name: req.body.name,
      phone: req.body.phone,
      status: req.body.status
    };
    
    // Handle avatar upload
    if (req.file) {
      // Delete old avatar if it exists and is not the default
      if (collaborator.avatar && !collaborator.avatar.includes('default-avatar') && fs.existsSync(path.join(__dirname, '../public', collaborator.avatar))) {
        fs.unlinkSync(path.join(__dirname, '../public', collaborator.avatar));
      }
      
      // Set new avatar path
      updateData.avatar = '/uploads/collaborators/' + req.file.filename;
    }
    
    // Update collaborator
    await collaborator.update(updateData);
    
    req.flash('success', 'Cập nhật thông tin cộng tác viên thành công');
    res.redirect(`/collaborators/${collaborator.id}`);
  } catch (err) {
    console.error('Collaborator update error:', err);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật thông tin cộng tác viên: ' + err.message);
    res.redirect(`/collaborators/${req.params.id}/edit`);
  }
});

// Delete collaborator
router.delete('/:id', async (req, res) => {
  try {
    const collaborator = await Collaborator.findByPk(req.params.id);
    
    if (!collaborator) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy cộng tác viên',
        error: {}
      });
    }
    
    // Check if collaborator has products
    const productCount = await Product.count({ where: { collaborator_id: req.params.id } });
    
    if (productCount > 0) {
      req.flash('warning', `Không thể xóa vì cộng tác viên đang quản lý ${productCount} sản phẩm. Vui lòng chuyển sản phẩm cho người khác trước.`);
      return res.redirect(`/collaborators/${req.params.id}`);
    }
    
    // Delete avatar file if it exists and is not the default
    if (collaborator.avatar && !collaborator.avatar.includes('default-avatar') && fs.existsSync(path.join(__dirname, '../public', collaborator.avatar))) {
      fs.unlinkSync(path.join(__dirname, '../public', collaborator.avatar));
    }
    
    // Delete collaborator
    await collaborator.destroy();
    
    req.flash('success', 'Xóa cộng tác viên thành công');
    res.redirect('/collaborators');
  } catch (err) {
    console.error('Collaborator delete error:', err);
    req.flash('error', 'Có lỗi xảy ra khi xóa cộng tác viên: ' + err.message);
    res.redirect('/collaborators');
  }
});

// Toggle collaborator status
router.post('/:id/toggle-status', async (req, res) => {
  try {
    const collaborator = await Collaborator.findByPk(req.params.id);
    
    if (!collaborator) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy cộng tác viên',
        error: {}
      });
    }
    
    // Toggle status (active <-> inactive)
    const newStatus = req.body.status;
    console.log('New status from request:', newStatus);
    
    // Handle both numeric and string values
    if (newStatus === undefined || newStatus === null || 
        (typeof newStatus === 'string' && newStatus !== '0' && newStatus !== '1' && newStatus !== 'active' && newStatus !== 'inactive') ||
        (typeof newStatus === 'number' && newStatus !== 0 && newStatus !== 1)) {
      console.log('Invalid status value:', newStatus);
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Phải là 0, 1, "active" hoặc "inactive".'
      });
    }
    
    // Convert string values to numeric if needed
    let statusValue;
    if (newStatus === 'active' || newStatus === '1' || newStatus === 1) {
      statusValue = 1;
    } else if (newStatus === 'inactive' || newStatus === '0' || newStatus === 0) {
      statusValue = 0;
    }
    
    await collaborator.update({ status: statusValue });
    
    req.flash('success', `Trạng thái cộng tác viên ${collaborator.name} đã được cập nhật thành ${statusValue === 1 ? 'Hoạt động' : 'Không hoạt động'}`);
    
    // Redirect back to the referrer or the collaborator list
    const redirectUrl = req.header('Referer') || '/collaborators';
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Collaborator status toggle error:', err);
    req.flash('error', 'Có lỗi xảy ra khi thay đổi trạng thái cộng tác viên: ' + err.message);
    res.redirect('/collaborators');
  }
});

// API endpoint to list collaborators
router.get('/api', async (req, res) => {
  try {
    console.log('GET /collaborators/api - Request received');
    console.log('Query parameters:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const where = {};
    
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    console.log('Database query with where:', where);
    
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
    
    console.log(`Found ${count} total collaborators, returning ${collaborators.length}`);
    
    const response = {
      success: true,
      data: {
        collaborators: collaboratorsWithCounts,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit)
        }
      }
    };
    
    console.log('Response data structure:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error('Error in GET /collaborators/api:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all collaborators as JSON (without pagination)
router.get('/api/all', async (req, res) => {
  try {
    console.log('Request for all collaborators received');
    
    // Get all collaborators with product counts
    const collaborators = await Collaborator.findAll({
      include: [
        { model: Product, as: 'products', required: false }
      ],
      order: [['id', 'ASC']]
    });
    
    // Add product count property to each collaborator
    const collaboratorsWithCounts = collaborators.map(collaborator => {
      const data = collaborator.toJSON();
      data.productCount = data.products ? data.products.length : 0;
      // Format dates for easier display
      data.created_at_formatted = new Date(data.created_at).toLocaleString('vi-VN');
      data.updated_at_formatted = new Date(data.updated_at).toLocaleString('vi-VN');
      return data;
    });
    
    console.log(`Returning ${collaboratorsWithCounts.length} collaborators`);
    
    res.json({
      success: true,
      count: collaboratorsWithCounts.length,
      data: collaboratorsWithCounts
    });
  } catch (err) {
    console.error('Error fetching all collaborators:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message,
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
});

// New route for toggle-status/:id that matches the fetch request in the frontend
router.post('/toggle-status/:id', async (req, res) => {
  try {
    console.log('Toggle status request received:');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const collaborator = await Collaborator.findByPk(req.params.id);
    
    if (!collaborator) {
      console.log('Collaborator not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cộng tác viên'
      });
    }
    
    console.log('Collaborator found:', collaborator.toJSON());
    
    // Get the new status from the request body
    const newStatus = req.body.status;
    console.log('New status from request:', newStatus);
    
    // Handle both numeric and string values
    if (newStatus === undefined || newStatus === null || 
        (typeof newStatus === 'string' && newStatus !== '0' && newStatus !== '1' && newStatus !== 'active' && newStatus !== 'inactive') ||
        (typeof newStatus === 'number' && newStatus !== 0 && newStatus !== 1)) {
      console.log('Invalid status value:', newStatus);
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Phải là 0, 1, "active" hoặc "inactive".'
      });
    }
    
    // Convert string values to numeric if needed
    let statusValue;
    if (newStatus === 'active' || newStatus === '1' || newStatus === 1) {
      statusValue = 1;
    } else if (newStatus === 'inactive' || newStatus === '0' || newStatus === 0) {
      statusValue = 0;
    }
    
    // Update the collaborator's status
    await collaborator.update({ status: statusValue });
    console.log('Collaborator updated successfully with new status:', statusValue);
    
    // Return success response
    const response = {
      success: true,
      message: `Trạng thái cộng tác viên ${collaborator.name} đã được cập nhật thành ${statusValue === 1 ? 'Hoạt động' : 'Không hoạt động'}`,
      data: {
        id: collaborator.id,
        name: collaborator.name,
        status: statusValue
      }
    };
    console.log('Sending response:', response);
    return res.json(response);
  } catch (err) {
    console.error('Collaborator status toggle error:', err);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi thay đổi trạng thái cộng tác viên: ' + err.message
    });
  }
});

module.exports = router; 