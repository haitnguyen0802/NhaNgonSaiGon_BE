const User = require('../models/User');
const AuthKey = require('../models/AuthKey');
const emailService = require('../utils/emailService');
const jwt = require('jsonwebtoken');

// Đăng ký người dùng
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo người dùng mới
    const newUser = await User.create({
      name,
      email,
      password, // Lưu ý: Trong thực tế, cần mã hóa mật khẩu trước khi lưu
      phoneNumber
    });

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    res.status(201).json({
      success: true,
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Tạo và gửi key mới
exports.generateAndSendKey = async (req, res, next) => {
  try {
    // Lấy tất cả địa chỉ email quản trị viên thay vì chỉ một email
    const adminEmails = emailService.getAdminEmails();
    const primaryEmail = adminEmails[0]; // Sử dụng email đầu tiên làm email chính cho database
    
    // Tạo key mới
    const key = AuthKey.generateSecureKey(32);
    const expiresAt = AuthKey.getNextMidnight();
    
    // Vô hiệu hóa tất cả các key cũ
    await AuthKey.update(
      { isActive: false },
      { where: { isActive: true } }
    );
    
    // Tạo key mới trong database
    const authKey = await AuthKey.create({
      username: 'duytien_nhangonsaigon',
      key,
      email: primaryEmail, // Sử dụng email đầu tiên cho database
      expiresAt,
      failedAttempts: 0,
      isActive: true
    });
    
    // Gửi key qua email đến tất cả admin
    const emailResult = await emailService.sendAuthKey(adminEmails, key, expiresAt);
    
    if (!emailResult.success) {
      throw new Error('Không thể gửi email: ' + emailResult.error);
    }
    
    if (req.xhr || req.path.startsWith('/api')) {
      res.status(200).json({
        success: true,
        message: 'Mã đăng nhập mới đã được gửi qua email.'
      });
    } else {
      req.flash('success', 'Mã đăng nhập mới đã được gửi qua email.');
      res.redirect('/auth/login');
    }
  } catch (error) {
    next(error);
  }
};

// Xử lý khi người dùng quên key
exports.forgotKey = async (req, res, next) => {
  try {
    // Tái sử dụng hàm tạo và gửi key
    await exports.generateAndSendKey(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Hiển thị form đăng nhập
exports.showLoginForm = async (req, res, next) => {
  try {
    // Kiểm tra xem đã có mã đăng nhập hoạt động chưa
    const existingActiveKey = await AuthKey.findOne({
      where: {
        username: 'duytien_nhangonsaigon',
        isActive: true
      }
    });

    // Nếu không có mã hoạt động hoặc mã đã hết hạn, tự động tạo mã mới
    if (!existingActiveKey || new Date() > new Date(existingActiveKey.expiresAt)) {
      // Lấy tất cả địa chỉ email quản trị viên
      const adminEmails = emailService.getAdminEmails();
      const primaryEmail = adminEmails[0]; // Sử dụng email đầu tiên làm email chính cho database
      
      // Tạo key mới
      const key = AuthKey.generateSecureKey(32);
      const expiresAt = AuthKey.getNextMidnight();
      
      // Vô hiệu hóa tất cả các key cũ
      await AuthKey.update(
        { isActive: false },
        { where: { isActive: true } }
      );
      
      // Tạo key mới trong database
      const authKey = await AuthKey.create({
        username: 'duytien_nhangonsaigon',
        key,
        email: primaryEmail,
        expiresAt,
        failedAttempts: 0,
        isActive: true
      });
      
      // Gửi key qua email đến tất cả admin
      const emailResult = await emailService.sendAuthKey(adminEmails, key, expiresAt);
      
      if (emailResult.success) {
        req.flash('success', 'Mã đăng nhập mới đã được gửi tới email của bạn.');
      } else {
        req.flash('error', 'Không thể gửi email. Vui lòng kiểm tra cấu hình email.');
      }
    }

    res.render('auth/login', {
      title: 'Đăng nhập | Nhà Ngon Sài Gòn',
      layout: false
    });
  } catch (error) {
    next(error);
  }
};

// Hiển thị form quên mật khẩu
exports.showForgotForm = (req, res) => {
  res.render('auth/forgot-key', {
    title: 'Quên mã đăng nhập | Nhà Ngon Sài Gòn',
    layout: false
  });
};

// Đăng nhập
exports.login = async (req, res, next) => {
  try {
    const { username, key } = req.body;

    // Kiểm tra xem người dùng đã cung cấp username và key chưa
    if (!username || !key) {
      req.flash('error', 'Vui lòng cung cấp tên đăng nhập và mã đăng nhập');
      return res.redirect('/auth/login');
    }

    // Kiểm tra xem username có đúng không
    if (username !== 'duytien_nhangonsaigon') {
      req.flash('error', 'Tên đăng nhập không đúng');
      return res.redirect('/auth/login');
    }

    // Tìm key đang active
    const authKey = await AuthKey.findOne({
      where: {
        username,
        isActive: true
      }
    });

    if (!authKey) {
      req.flash('error', 'Không tìm thấy mã đăng nhập hợp lệ. Vui lòng yêu cầu mã mới.');
      return res.redirect('/auth/login');
    }

    // Kiểm tra xem key có hết hạn chưa
    if (new Date() > new Date(authKey.expiresAt)) {
      req.flash('error', 'Mã đăng nhập đã hết hạn. Vui lòng yêu cầu mã mới.');
      return res.redirect('/auth/login');
    }

    // Kiểm tra key
    if (authKey.key !== key) {
      // Tăng số lần đăng nhập sai
      authKey.failedAttempts += 1;
      await authKey.save();

      // Nếu đăng nhập sai quá 3 lần, tạo key mới
      if (authKey.failedAttempts >= 3) {
        // Tạo và gửi key mới
        await exports.generateAndSendKey(req, res, next);
        return;
      }

      const remainingAttempts = 3 - authKey.failedAttempts;
      req.flash('error', `Mã đăng nhập không đúng. Bạn còn ${remainingAttempts} lần thử.`);
      return res.redirect('/auth/login');
    }

    // Reset số lần đăng nhập sai
    authKey.failedAttempts = 0;
    await authKey.save();

    // Tạo session cho người dùng
    req.session.user = {
      id: 1, // ID mặc định cho admin
      username: authKey.username,
      role: 'admin',
      email: authKey.email,
      name: 'Admin' // Thêm name để hiển thị trên giao diện
    };
    
    // Đảm bảo session được lưu
    req.session.save();
    
    // Tạo JWT token nếu cần
    const token = jwt.sign(
      { id: 1, username: authKey.username, role: 'admin' },
      process.env.JWT_SECRET || 'nhangonsaigon-secret',
      { expiresIn: '24h' }
    );

    if (req.xhr || req.path.startsWith('/api')) {
      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token,
          user: req.session.user
        }
      });
    } else {
      // Thêm script để lưu vào sessionStorage
      const userData = {
        id: req.session.user.id,
        username: req.session.user.username,
        name: req.session.user.name,
        role: req.session.user.role,
        email: req.session.user.email,
        token: token
      };
      
      // Flash thông báo thành công
      req.flash('success', 'Đăng nhập thành công');
      
      // Gửi thông tin người dùng để lưu vào sessionStorage
      res.render('auth/auth-redirect', {
        title: 'Đăng nhập thành công',
        layout: false,
        userDataJSON: JSON.stringify(userData),
        redirectUrl: '/dashboard'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Đăng xuất
exports.logout = (req, res) => {
  // Render trang trung gian để xóa sessionStorage trước khi xóa session
  res.render('auth/logout-redirect', {
    title: 'Đăng xuất',
    layout: false,
    redirectUrl: '/auth/login'
  });
  
  // Xóa session sau khi đã render trang
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Lỗi khi xóa session:', err);
      }
    });
  }
}; 