const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'products',
      key: 'id'
    },
    field: 'product_id'
  },
  image_url: {
    type: DataTypes.STRING,
    field: 'image_url'
  }
}, {
  tableName: 'product_images',
  timestamps: false
});

module.exports = ProductImage; 