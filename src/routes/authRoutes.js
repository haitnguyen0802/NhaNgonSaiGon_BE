const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');

// Đăng ký tài khoản mới
router.post('/register', authValidation.validateRegister, authController.register);

// Đăng nhập
router.post('/login', authValidation.validateLogin, authController.login);

module.exports = router; 