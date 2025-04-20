require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Kiểm tra xem ứng dụng đang chạy trên môi trường nào
const isRunningOnCPanel = process.env.NODE_ENV === 'production' || 
                         process.env.HOME?.includes('/home/nhangons');

// Kiểm tra xem ứng dụng có đang chạy trên máy tính cục bộ không
const isRunningOnLocalMachine = os.platform() === 'win32' || 
                              os.hostname().includes('Acer');

console.log('Môi trường chạy:', {
  NODE_ENV: process.env.NODE_ENV,
  isRunningOnCPanel,
  isRunningOnLocalMachine,
  platform: os.platform(),
  hostname: os.hostname()
});

// Cấu hình cơ bản
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  timezone: '+07:00', // Timezone cho Việt Nam
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Nếu đang chạy trên máy tính cục bộ Windows và kết nối đến máy chủ từ xa
if (isRunningOnLocalMachine && !isRunningOnCPanel) {
  console.log('Đang chạy trên máy tính cục bộ, kiểm tra SSH Tunnel...');
  
  // Kiểm tra xem SSH Tunnel có sẵn sàng không (localhost:3307)
  const net = require('net');
  const testSocket = new net.Socket();
  
  // Kiểm tra kết nối đến localhost:3307 (SSH Tunnel)
  testSocket.setTimeout(1000);  // Timeout 1 giây
  testSocket.on('error', () => {
    console.log('⚠️ CẢNH BÁO: SSH Tunnel không hoạt động! ⚠️');
    console.log('Vui lòng đọc file SSH_TUNNEL.md để biết cách thiết lập SSH Tunnel');
    console.log('Hoặc sử dụng file .env.local nếu bạn đã có');
  });
  
  testSocket.connect(3307, '127.0.0.1', () => {
    console.log('✅ SSH Tunnel đang hoạt động (cổng 3307)');
    testSocket.destroy();
  });
  
  // Đề xuất sử dụng SSH Tunnel
  console.log('Đề xuất: Sử dụng SSH Tunnel để kết nối đến MySQL từ xa');
  console.log('DB_HOST=127.0.0.1');
  console.log('DB_PORT=3307');
}

// Thêm socketPath nếu kết nối qua localhost trên cPanel
if (process.env.DB_HOST === 'localhost' && isRunningOnCPanel) {
  // Các đường dẫn socket MySQL phổ biến
  const possibleSocketPaths = [
    '/var/lib/mysql/mysql.sock',        // CentOS/RHEL
    '/var/run/mysqld/mysqld.sock',      // Debian/Ubuntu
    '/tmp/mysql.sock'                    // Một số hệ thống khác
  ];
  
  // Kiểm tra các đường dẫn socket
  for (const socketPath of possibleSocketPaths) {
    if (fs.existsSync(socketPath)) {
      console.log(`Sử dụng socket MySQL: ${socketPath}`);
      dbConfig.socketPath = socketPath;
      // Xóa host và port khi sử dụng socket
      delete dbConfig.host;
      delete dbConfig.port;
      break;
    }
  }
}

console.log('Cấu hình kết nối database:', {
  host: dbConfig.host || 'using socket',
  port: dbConfig.port,
  database: process.env.DB_NAME,
  username: process.env.DB_USER
});

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  dbConfig
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối với cơ sở dữ liệu MySQL thành công');
    
    // Đồng bộ hóa các model với database (không xóa dữ liệu hiện có)
    // Chỉ kiểm tra kết nối, không tự động thay đổi cấu trúc bảng để tránh lỗi
    await sequelize.sync({ alter: false });
    console.log('Kết nối model thành công');
  } catch (error) {
    console.error('Không thể kết nối với cơ sở dữ liệu:', error);
    
    if (error.name === 'SequelizeHostNotFoundError') {
      console.error('⚠️ Không tìm thấy host. Vui lòng kiểm tra lại DB_HOST trong file .env');
    } 
    else if (error.name === 'SequelizeAccessDeniedError') {
      if (isRunningOnLocalMachine && !isRunningOnCPanel) {
        console.error('⚠️ Quyền truy cập bị từ chối. Bạn đang cố gắng kết nối từ xa.');
        console.error('Vui lòng đọc file REMOTE_CONNECTION_GUIDE.md để biết cách kết nối');
      } else {
        console.error('⚠️ Quyền truy cập bị từ chối. Vui lòng kiểm tra tên người dùng và mật khẩu');
      }
    }
    
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 