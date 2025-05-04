const express = require('express');
const router = express.Router();
const productWebRoutes = require('./productWebRoutes');

/**
 * Router chính cho các routes liên quan đến Product
 * File này chỉ phục vụ như một wrapper/redirector cho web routes
 */

// Sử dụng routes web
router.use('/', productWebRoutes);

module.exports = router; 