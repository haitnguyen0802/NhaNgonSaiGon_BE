const User = require('./User');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Post = require('./Post');
const Collaborator = require('./Collaborator');
const Category = require('./Category');

// Product associations
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
Product.hasMany(Post, { foreignKey: 'product_id', as: 'posts' });
Product.belongsTo(Collaborator, { foreignKey: 'collaborator_id', as: 'collaborator' });

// ProductImage associations
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Post associations
Post.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Collaborator associations
Collaborator.hasMany(Product, { foreignKey: 'collaborator_id', as: 'products' });

module.exports = {
  User,
  Product,
  ProductImage,
  Post,
  Collaborator,
  Category
}; 