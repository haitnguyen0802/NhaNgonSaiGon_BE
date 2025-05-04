const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const {
  Product,
  Collaborator,
  ProductImage,
  Category,
} = require("../models/index");
const { Op } = require("sequelize");

/**
 * API Routes cho Product
 * Base path: /api/products
 */

// GET /api/products - Lấy danh sách sản phẩm
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.search) {
      where.title = { [Op.like]: `%${req.query.search}%` };
    }

    if (req.query.collaborator) {
      where.collaborator_id = req.query.collaborator;
    }

    // Thêm tìm kiếm theo product_mts
    if (req.query.product_mts) {
      where.product_mts = req.query.product_mts;
    }

    // Xử lý sắp xếp
    let order = [["updated_at", "DESC"]];

    if (req.query.sort) {
      const sortParams = req.query.sort.split(":");
      const sortField = sortParams[0];
      const sortDirection =
        sortParams.length > 1 && sortParams[1].toUpperCase() === "ASC"
          ? "ASC"
          : "DESC";

      const allowedFields = [
        "id",
        "title",
        "price",
        "updated_at",
        "created_at",
        "product_mts",
      ];
      if (allowedFields.includes(sortField)) {
        order = [[sortField, sortDirection]];
      }
    }

    // Get products with filters
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        { model: Collaborator, as: "collaborator" },
        { model: ProductImage, as: "images" },
      ],
      limit,
      offset,
      order,
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/stats - Lấy thống kê sản phẩm
router.get("/stats", productController.getProductStats);

// GET /api/products/by-mts/:mts - Lấy sản phẩm theo mã MTS
router.get("/by-mts/:mts", async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        product_mts: req.params.mts,
      },
      include: [
        { model: Collaborator, as: "collaborator" },
        { model: ProductImage, as: "images" },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm với mã này",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/by-category/:id - Lấy sản phẩm theo danh mục
router.get("/by-category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Tìm danh mục để kiểm tra tồn tại
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    // Tìm tất cả sản phẩm thuộc danh mục
    const { count, rows: products } = await Product.findAndCountAll({
      where: { category_id: categoryId },
      include: [
        { model: Collaborator, as: "collaborator" },
        { model: ProductImage, as: "images" },
      ],
      limit,
      offset,
      order: [["updated_at", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        products,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET /api/products/:id - Lấy chi tiết một sản phẩm
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Collaborator, as: "collaborator" },
        { model: ProductImage, as: "images" },
        { model: Category, as: "category" },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products - Tạo sản phẩm mới
router.post(
  "/",
  authMiddleware.isAuth,
  uploadMiddleware.uploadProductImages,
  uploadMiddleware.handleUploadError,
  productController.createProduct
);

// PUT /api/products/:id - Cập nhật sản phẩm
router.put(
  "/:id",
  authMiddleware.isAuth,
  uploadMiddleware.uploadProductImages,
  uploadMiddleware.handleUploadError,
  productController.updateProduct
);

// DELETE /api/products/:id - Xóa sản phẩm
router.delete(
  "/:id",
  authMiddleware.isAuth,
  authMiddleware.isAdmin,
  productController.deleteProduct
);

module.exports = router;
