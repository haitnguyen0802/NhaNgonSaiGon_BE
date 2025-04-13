const { Product, Post, Collaborator, Category, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Lấy thông tin tổng quan cho dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Thống kê sản phẩm
    const totalProducts = await Product.count();
    const availableProducts = await Product.count({ where: { status: 'available' }});
    const soldProducts = await Product.count({ where: { status: 'sold' }});
    const discountedProducts = await Product.count({ where: { is_discounted: true }});
    const flashSaleProducts = await Product.count({ where: { is_flash_sale: true }});
    
    // Thống kê bài đăng
    const totalPosts = await Post.count();
    const publishedPosts = await Post.count({ where: { status: 'public' }});
    const pendingPosts = await Post.count({ where: { status: 'pending' }});
    
    // Thông tin cộng tác viên
    const totalCollaborators = await Collaborator.count();
    const activeCollaborators = await Collaborator.count({ where: { active: true }});
    
    // Thông tin danh mục
    const totalCategories = await Category.count();
    
    // Lấy 10 sản phẩm được xem nhiều nhất
    const topProducts = await Product.findAll({
      attributes: ['id', 'title', 'price', 'status', 'representative_image', 'favorite_count'],
      order: [['favorite_count', 'DESC']],
      limit: 10
    });
    
    // Lấy 10 bài đăng mới nhất
    const recentPosts = await Post.findAll({
      attributes: ['id', 'title', 'status', 'view_count', 'representative_image', 'publish_date'],
      order: [['created_at', 'DESC']],
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      limit: 10
    });
    
    // Lấy 5 sản phẩm giảm giá
    const discountProducts = await Product.findAll({
      where: { is_discounted: true },
      attributes: ['id', 'title', 'price', 'discount_price', 'status', 'representative_image'],
      order: [['updated_at', 'DESC']],
      limit: 5
    });
    
    // Lấy 5 sản phẩm flash sale
    const flashSaleItems = await Product.findAll({
      where: { is_flash_sale: true },
      attributes: ['id', 'title', 'price', 'discount_price', 'status', 'representative_image'],
      order: [['updated_at', 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          products: {
            total: totalProducts,
            available: availableProducts,
            sold: soldProducts,
            discounted: discountedProducts,
            flashSale: flashSaleProducts
          },
          posts: {
            total: totalPosts,
            published: publishedPosts,
            pending: pendingPosts
          },
          collaborators: {
            total: totalCollaborators,
            active: activeCollaborators
          },
          categories: {
            total: totalCategories
          }
        },
        topProducts,
        recentPosts,
        discountProducts,
        flashSaleItems
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy dữ liệu thống kê theo thời gian (ví dụ: theo tháng)
exports.getTimelineStats = async (req, res, next) => {
  try {
    const { period = 'month', limit = 6 } = req.query;
    
    let dateFormat, dateGrouping;
    
    // Định dạng thời gian theo yêu cầu
    if (period === 'day') {
      dateFormat = 'YYYY-MM-DD';
      dateGrouping = Sequelize.fn('DATE', Sequelize.col('created_at'));
    } else if (period === 'week') {
      dateFormat = 'YYYY-"W"WW';
      dateGrouping = Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-W%u');
    } else {
      dateFormat = 'YYYY-MM';
      dateGrouping = Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m');
    }
    
    // Thống kê sản phẩm theo thời gian
    const productStats = await Product.findAll({
      attributes: [
        [dateGrouping, 'time'], 
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['time'],
      order: [['time', 'ASC']],
      limit: Number(limit),
      raw: true
    });
    
    // Thống kê bài đăng theo thời gian
    const postStats = await Post.findAll({
      attributes: [
        [dateGrouping, 'time'], 
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['time'],
      order: [['time', 'ASC']],
      limit: Number(limit),
      raw: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        productStats,
        postStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin tổng quan cho từng loại đối tượng
exports.getOverviewStats = async (req, res, next) => {
  try {
    // Thống kê trạng thái sản phẩm
    const productStatusStats = await Product.findAll({
      attributes: [
        'status', 
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Thống kê danh mục sản phẩm
    const productCategoryStats = await Product.findAll({
      attributes: [
        'category_id',
        [Sequelize.col('category.name'), 'name'],
        [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count']
      ],
      include: [
        { model: Category, as: 'category', attributes: [] }
      ],
      group: ['category_id', 'category.name'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'DESC']],
      limit: 10,
      raw: true
    });
    
    // Thống kê bài đăng theo trạng thái
    const postStatusStats = await Post.findAll({
      attributes: [
        'status', 
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Thống kê số lượng sản phẩm của từng CTV
    const collaboratorStats = await Product.findAll({
      attributes: [
        'collaborator_id',
        [Sequelize.col('collaborator.name'), 'name'],
        [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count']
      ],
      include: [
        { model: Collaborator, as: 'collaborator', attributes: [] }
      ],
      group: ['collaborator_id', 'collaborator.name'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'DESC']],
      limit: 10,
      raw: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        productStatusStats,
        productCategoryStats,
        postStatusStats,
        collaboratorStats
      }
    });
  } catch (error) {
    next(error);
  }
}; 