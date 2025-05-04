const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const slugify = require('../utils/slugify');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  slug: {
    type: DataTypes.STRING
  },
  image: {
    type: DataTypes.STRING
  },
  parent_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Categories',
      key: 'id'
    },
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (category) => {
      if (category.name && !category.slug) {
        category.slug = slugify(category.name);
      }
    },
    beforeUpdate: (category) => {
      if (category.changed('name') && !category.changed('slug')) {
        category.slug = slugify(category.name);
      }
    }
  }
});

module.exports = Category; 