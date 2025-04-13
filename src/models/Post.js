const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  representative_image: {
    type: DataTypes.STRING,
    field: 'representative_image'
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'categories',
      key: 'id'
    },
    field: 'category_id',
    allowNull: true
  },
  author_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'author_id'
  },
  collaborator_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'collaborators',
      key: 'id'
    },
    field: 'collaborator_id',
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'public'),
    defaultValue: 'pending'
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_pinned'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  publish_date: {
    type: DataTypes.DATE,
    field: 'publish_date'
  },
  pin_date: {
    type: DataTypes.DATE,
    field: 'pin_date',
    allowNull: true
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
    field: 'product_id',
    allowNull: false
  }
}, {
  tableName: 'posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Post; 