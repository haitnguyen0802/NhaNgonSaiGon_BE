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
Post.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// User associations
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });

// Category associations
Category.hasMany(Post, { foreignKey: 'category_id', as: 'posts' });
Category.belongsTo(Category, { as: 'parentCategory', foreignKey: 'parent_id' });
Category.hasMany(Category, { as: 'childCategories', foreignKey: 'parent_id' });

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