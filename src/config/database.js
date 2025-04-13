require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
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
  }
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
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 