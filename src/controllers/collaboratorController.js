const Collaborator = require("../models/Collaborator");
const Product = require("../models/Product");
const AppError = require("../utils/errorHandler");

// Lấy tất cả cộng tác viên
exports.getAllCollaborators = async (req, res, next) => {
  console.log("res.json()", res.json());
  try {
    const { active, search, sort = "name", page = 1, limit = 10 } = req.query;

    const queryObj = {};

    if (active !== undefined) {
      queryObj.active = active === "true";
    }

    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const query = Collaborator.find(queryObj)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Thực hiện đếm tổng số
    const total = await Collaborator.countDocuments(queryObj);

    // Lấy dữ liệu với virtual productCount
    const collaborators = await query.populate("productCount");

    res.status(200).json({
      success: true,
      count: collaborators.length,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      data: collaborators,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin một cộng tác viên
exports.getCollaboratorById = async (req, res, next) => {
  try {
    const collaborator = await Collaborator.findById(req.params.id).populate(
      "userId",
      "name email"
    );

    if (!collaborator) {
      return next(new AppError("Không tìm thấy cộng tác viên", 404));
    }

    // Lấy số lượng sản phẩm quản lý
    const productCount = await Product.countDocuments({
      collaborator: req.params.id,
    });

    // Lấy danh sách sản phẩm gần đây
    const recentProducts = await Product.find({ collaborator: req.params.id })
      .select("name price status mainImage updatedAt")
      .sort("-updatedAt")
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        ...collaborator.toObject(),
        productCount,
        recentProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Tạo cộng tác viên mới
exports.createCollaborator = async (req, res, next) => {
  try {
    const collaborator = await Collaborator.create(req.body);

    res.status(201).json({
      success: true,
      data: collaborator,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật cộng tác viên
exports.updateCollaborator = async (req, res, next) => {
  try {
    const collaborator = await Collaborator.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!collaborator) {
      return next(new AppError("Không tìm thấy cộng tác viên", 404));
    }

    res.status(200).json({
      success: true,
      data: collaborator,
    });
  } catch (error) {
    next(error);
  }
};

// Xóa cộng tác viên
exports.deleteCollaborator = async (req, res, next) => {
  try {
    const collaborator = await Collaborator.findById(req.params.id);

    if (!collaborator) {
      return next(new AppError("Không tìm thấy cộng tác viên", 404));
    }

    // Kiểm tra xem có sản phẩm nào đang được quản lý bởi CTV không
    const productCount = await Product.countDocuments({
      collaborator: req.params.id,
    });

    if (productCount > 0) {
      return next(
        new AppError(
          "Không thể xóa vì CTV đang quản lý sản phẩm. Vui lòng chuyển sản phẩm cho người khác trước.",
          400
        )
      );
    }

    await Collaborator.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Cộng tác viên đã được xóa",
    });
  } catch (error) {
    next(error);
  }
};

// Thống kê của cộng tác viên
exports.getCollaboratorStats = async (req, res, next) => {
  try {
    const collaborator = await Collaborator.findById(req.params.id);

    if (!collaborator) {
      return next(new AppError("Không tìm thấy cộng tác viên", 404));
    }

    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments({
      collaborator: req.params.id,
    });

    // Số sản phẩm theo trạng thái
    const availableProducts = await Product.countDocuments({
      collaborator: req.params.id,
      status: "available",
    });

    const soldProducts = await Product.countDocuments({
      collaborator: req.params.id,
      status: "sold",
    });

    const discountedProducts = await Product.countDocuments({
      collaborator: req.params.id,
      isDiscounted: true,
    });

    const flashSaleProducts = await Product.countDocuments({
      collaborator: req.params.id,
      isFlashSale: true,
    });

    // Lấy 5 sản phẩm mới nhất
    const recentProducts = await Product.find({ collaborator: req.params.id })
      .select("name price status mainImage updatedAt")
      .sort("-updatedAt")
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        availableProducts,
        soldProducts,
        discountedProducts,
        flashSaleProducts,
        recentProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách sản phẩm của cộng tác viên
exports.getCollaboratorProducts = async (req, res, next) => {
  try {
    const { status, sort = "-createdAt", page = 1, limit = 10 } = req.query;

    const queryObj = { collaborator: req.params.id };

    if (status) {
      queryObj.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const query = Product.find(queryObj)
      .select("name price status mainImage updatedAt category")
      .populate("category", "name")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(queryObj);

    const products = await query;

    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
