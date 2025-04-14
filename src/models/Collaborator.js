const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Collaborator = sequelize.define('Collaborator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  avatar: {
    type: DataTypes.STRING
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  total_products: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_products'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  tableName: 'collaborators',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Collaborator; 