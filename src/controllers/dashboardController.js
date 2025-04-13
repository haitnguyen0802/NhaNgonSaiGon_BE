const Product = require('../models/Product');
const Post = require('../models/Post');
const Collaborator = require('../models/Collaborator');
const Category = require('../models/Category');

// Lấy thông tin tổng quan cho dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Thống kê sản phẩm
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ status: 'available' });
    const soldProducts = await Product.countDocuments({ status: 'sold' });
    const discountedProducts = await Product.countDocuments({ isDiscounted: true });
    const flashSaleProducts = await Product.countDocuments({ isFlashSale: true });
    
    // Thống kê bài đăng
    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const pendingPosts = await Post.countDocuments({ status: 'pending' });
    const draftPosts = await Post.countDocuments({ status: 'draft' });
    
    // Thông tin cộng tác viên
    const totalCollaborators = await Collaborator.countDocuments();
    const activeCollaborators = await Collaborator.countDocuments({ active: true });
    
    // Thông tin danh mục
    const totalCategories = await Category.countDocuments();
    
    // Lấy 10 sản phẩm được xem nhiều nhất (giả định có trường viewCount)
    const topProducts = await Product.find()
      .select('name price status mainImage favoriteCount')
      .sort('-favoriteCount')
      .limit(10);
    
    // Lấy 10 bài đăng mới nhất
    const recentPosts = await Post.find()
      .select('title status viewCount mainImage publishDate')
      .sort('-createdAt')
      .limit(10);
    
    // Lấy 5 sản phẩm giảm giá
    const discountProducts = await Product.find({ isDiscounted: true })
      .select('name price discountPrice status mainImage')
      .sort('-updatedAt')
      .limit(5);
    
    // Lấy 5 sản phẩm flash sale
    const flashSaleItems = await Product.find({ isFlashSale: true })
      .select('name price discountPrice status mainImage')
      .sort('-updatedAt')
      .limit(5);
    
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
            pending: pendingPosts,
            draft: draftPosts
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
    
    let timeFormat;
    let groupBy;
    
    // Định dạng thời gian theo yêu cầu
    if (period === 'day') {
      timeFormat = '%Y-%m-%d';
      groupBy = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
    } else if (period === 'week') {
      timeFormat = '%Y-W%U';
      groupBy = { week: { $week: '$createdAt' }, year: { $year: '$createdAt' } };
    } else {
      timeFormat = '%Y-%m';
      groupBy = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
    }
    
    // Thống kê sản phẩm theo thời gian
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          time: { $first: { $dateToString: { format: timeFormat, date: '$createdAt' } } }
        }
      },
      { $sort: { 'time': -1 } },
      { $limit: Number(limit) },
      { $sort: { 'time': 1 } }
    ]);
    
    // Thống kê bài đăng theo thời gian
    const postStats = await Post.aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          time: { $first: { $dateToString: { format: timeFormat, date: '$createdAt' } } }
        }
      },
      { $sort: { 'time': -1 } },
      { $limit: Number(limit) },
      { $sort: { 'time': 1 } }
    ]);
    
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
    const productStatusStats = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Thống kê danh mục sản phẩm
    const productCategoryStats = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: { id: '$category', name: '$categoryInfo.name' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: '$_id.id',
          name: '$_id.name',
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Thống kê bài đăng theo trạng thái
    const postStatusStats = await Post.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Thống kê số lượng sản phẩm của từng CTV
    const collaboratorStats = await Product.aggregate([
      {
        $lookup: {
          from: 'collaborators',
          localField: 'collaborator',
          foreignField: '_id',
          as: 'collaboratorInfo'
        }
      },
      {
        $unwind: {
          path: '$collaboratorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: { id: '$collaborator', name: '$collaboratorInfo.name' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: '$_id.id',
          name: '$_id.name',
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
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