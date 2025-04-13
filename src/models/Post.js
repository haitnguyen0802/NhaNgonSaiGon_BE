const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  representative_image: {
    type: DataTypes.STRING,
    field: 'representative_image'
  },
  category: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'public'),
    defaultValue: 'pending'
  },
  pin_date: {
    type: DataTypes.DATE,
    field: 'pin_date'
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted'
  },
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'products',
      key: 'id'
    },
    field: 'product_id'
  }
}, {
  tableName: 'posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Post; 