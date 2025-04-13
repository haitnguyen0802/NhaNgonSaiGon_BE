const User = require('../models/User');

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

// Đăng nhập
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra xem người dùng đã cung cấp email và mật khẩu chưa
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mật khẩu'
      });
    }

    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra mật khẩu
    // Lưu ý: Trong thực tế, cần so sánh mật khẩu đã mã hóa
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo token và gửi lại cho người dùng
    // Lưu ý: Trong thực tế, cần tạo JWT token
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}; 