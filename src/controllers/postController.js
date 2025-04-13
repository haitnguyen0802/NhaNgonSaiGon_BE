const Post = require('../models/Post');
const AppError = require('../utils/errorHandler');

// Lấy tất cả bài đăng với bộ lọc
exports.getAllPosts = async (req, res, next) => {
  try {
    const { 
      status, 
      category, 
      author,
      collaborator,
      isPinned,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Tạo đối tượng query
    const queryObj = {};

    // Lọc theo trạng thái
    if (status) queryObj.status = status;
    
    // Lọc theo danh mục
    if (category) queryObj.category = category;
    
    // Lọc theo tác giả
    if (author) queryObj.author = author;
    
    // Lọc theo CTV
    if (collaborator) queryObj.collaborator = collaborator;
    
    // Lọc bài ghim
    if (isPinned) queryObj.isPinned = isPinned === 'true';
    
    // Tìm kiếm theo tiêu đề và nội dung
    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Tính số lượng bỏ qua
    const skip = (Number(page) - 1) * Number(limit);

    // Thực hiện truy vấn
    const query = Post.find(queryObj)
      .populate('category', 'name slug')
      .populate('author', 'name')
      .populate('collaborator', 'name phoneNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Thực hiện truy vấn đếm tổng số
    const total = await Post.countDocuments(queryObj);
    
    // Lấy kết quả
    const posts = await query;

    // Phản hồi
    res.status(200).json({
      success: true,
      count: posts.length,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin một bài đăng
exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('author', 'name')
      .populate('collaborator', 'name phoneNumber')
      .populate('productId');

    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }

    // Tăng lượt xem
    post.viewCount += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Tạo bài đăng mới
exports.createPost = async (req, res, next) => {
  try {
    // Nếu người dùng đăng nhập, thêm thông tin tác giả
    if (req.user) {
      req.body.author = req.user.id;
    }

    // Nếu trạng thái là published, thêm ngày xuất bản
    if (req.body.status === 'published') {
      req.body.publishDate = new Date();
    }

    const post = await Post.create(req.body);

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật bài đăng
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }

    // Kiểm tra quyền, chỉ tác giả hoặc admin mới có thể cập nhật
    if (req.user && post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Bạn không có quyền cập nhật bài đăng này', 403));
    }

    // Nếu cập nhật trạng thái thành published và trước đó không phải published
    if (req.body.status === 'published' && post.status !== 'published') {
      req.body.publishDate = new Date();
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

// Xóa bài đăng
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }

    // Kiểm tra quyền, chỉ tác giả hoặc admin mới có thể xóa
    if (req.user && post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Bạn không có quyền xóa bài đăng này', 403));
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Bài đăng đã được xóa'
    });
  } catch (error) {
    next(error);
  }
};

// Thay đổi trạng thái bài đăng
exports.updatePostStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'pending', 'published'].includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 400));
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }
    
    // Nếu chuyển sang published và trước đó không phải published
    if (status === 'published' && post.status !== 'published') {
      post.publishDate = new Date();
    }
    
    post.status = status;
    await post.save();
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Ghim / bỏ ghim bài đăng
exports.togglePinPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Không tìm thấy bài đăng', 404));
    }
    
    post.isPinned = !post.isPinned;
    await post.save();
    
    res.status(200).json({
      success: true,
      data: post,
      message: post.isPinned ? 'Bài đăng đã được ghim' : 'Bài đăng đã được bỏ ghim'
    });
  } catch (error) {
    next(error);
  }
}; 