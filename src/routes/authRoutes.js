const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// Đăng ký tài khoản mới
router.post('/register', authValidation.validateRegister, authController.register);

// Hiển thị form đăng nhập
router.get('/login', authController.showLoginForm);

// Xử lý đăng nhập
router.post('/login', authController.login);

// Hiển thị form quên key
router.get('/forgot-key', isLoggedIn, authController.showForgotForm);

// Xử lý quên key
router.post('/forgot-key', authController.forgotKey);

// Đăng xuất
router.get('/logout', authController.logout);

// API routes
router.post('/api/login', authController.login);
router.post('/api/forgot-key', authController.forgotKey);
router.post('/api/generate-key', authController.generateAndSendKey);

module.exports = router; 