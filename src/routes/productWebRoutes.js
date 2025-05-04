const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const cloudinaryUploadMiddleware = require("../middlewares/cloudinaryUploadMiddleware");
const {
  Product,
  Collaborator,
  ProductImage,
  Category,
} = require("../models/index");
const { Op } = require("sequelize");

/**
 * Web Routes cho Product
 * Base path: /products
 */

// GET /products - Hiển thị trang danh sách sản phẩm
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
      // Kiểm tra xem search có phải là số và có thể là product_mts không
      if (/^\d+$/.test(req.query.search)) {
        // Nếu là số, tìm kiếm theo cả title và product_mts
        where[Op.or] = [
          { title: { [Op.like]: `%${req.query.search}%` } },
          { product_mts: req.query.search },
        ];
      } else {
        // Nếu không phải số, chỉ tìm theo title
        where.title = { [Op.like]: `%${req.query.search}%` };
      }
    }

    // Thêm tìm kiếm riêng theo product_mts nếu có
    if (req.query.product_mts) {
      where.product_mts = req.query.product_mts;
    }

    // Thêm lọc theo danh mục nếu có
    if (req.query.category) {
      where.category_id = req.query.category;
    }

    // Filter by collaborator if specified
    let include = [{ model: Collaborator, as: "collaborator" }];
    if (req.query.collaborator) {
      include[0].where = { id: req.query.collaborator };
    }

    // Get categories for filter dropdown
    const categories = await Category.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    console.log("categories", categories);

    // Get products with filters
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [["updated_at", "DESC"]],
    });

    // Calculate pagination
    const totalPages = Math.ceil(count / limit);

    // Build query string for pagination
    let queryString = "";
    if (req.query.status) queryString += `&status=${req.query.status}`;
    if (req.query.search) queryString += `&search=${req.query.search}`;
    if (req.query.collaborator)
      queryString += `&collaborator=${req.query.collaborator}`;
    if (req.query.category) queryString += `&category=${req.query.category}`;

    res.render("products/index", {
      title: "Quản lý sản phẩm",
      active: "products",
      products,
      categories,
      totalProducts: count,
      currentPage: page,
      totalPages,
      queryString,
      search: req.query.search || "",
      status: req.query.status || "",
      selectedCategory: req.query.category || "",
    });
  } catch (err) {
    console.error("Product listing error:", err);
    res.status(500).render("error", {
      message: "Không thể tải danh sách sản phẩm",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
});

// GET /products/stats - Lấy thống kê sản phẩm (Web view)
router.get("/stats", async (req, res) => {
  try {
    const totalProducts = await Product.count();
    const availableProducts = await Product.count({
      where: { status: "available" },
    });
    const soldProducts = await Product.count({
      where: { status: "sold" },
    });

    // Render the statistics page with the data
    res.render("products/stats", {
      title: "Thống kê sản phẩm",
      active: "products",
      stats: {
        totalProducts,
        availableProducts,
        soldProducts,
      },
    });
  } catch (err) {
    console.error("Product stats error:", err);
    res.status(500).render("error", {
      message: "Không thể tải thống kê sản phẩm",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
});

// GET /products/create - Hiển thị form tạo sản phẩm mới
router.get("/create", authMiddleware.isAuth, async (req, res) => {
  try {
    // Get collaborators for the dropdown
    const collaborators = await Collaborator.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    // Lấy tất cả danh mục với thông tin về cấu trúc cha-con
    const categories = await Category.findAll({
      attributes: ["id", "name", "parent_id"],
      order: [["name", "ASC"]],
    });

    res.render("products/create", {
      title: "Thêm sản phẩm mới",
      active: "products",
      collaborators,
      categories,
    });
  } catch (err) {
    console.error("Product creation form error:", err);
    res.status(500).render("error", {
      message: "Không thể tải form tạo sản phẩm",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
});

// GET /products/:id - Hiển thị chi tiết sản phẩm
router.get("/:id", async (req, res) => {
  try {
    console.log(`[DEBUG] GET /products/${req.params.id} - Đang tìm sản phẩm`);

    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Collaborator, as: "collaborator" },
        { model: ProductImage, as: "images" },
        { model: Category, as: "category" },
      ],
    });

    if (!product) {
      console.log(`[DEBUG] Không tìm thấy sản phẩm với ID: ${req.params.id}`);
      return res.status(404).render("error", {
        message: "Không tìm thấy sản phẩm",
        error: {},
      });
    }

    console.log(
      `[DEBUG] Tìm thấy sản phẩm: ${product.title}, Mã: ${product.product_mts}`
    );
    console.log(`[DEBUG] Thông tin category:`, product.category);

    res.render("products/detail", {
      title: product.title || "Chi tiết sản phẩm",
      active: "products",
      product,
    });
  } catch (err) {
    console.error("[DEBUG] Product detail error:", err);
    res.status(500).render("error", {
      message: "Không thể tải chi tiết sản phẩm",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
});

// GET /products/:id/edit - Hiển thị form chỉnh sửa sản phẩm
router.get("/:id/edit", authMiddleware.isAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Collaborator, as: "collaborator" },
        { model: ProductImage, as: "images" },
        { model: Category, as: "category" },
      ],
    });

    if (!product) {
      return res.status(404).render("error", {
        message: "Không tìm thấy sản phẩm",
        error: {},
      });
    }

    // Get collaborators for the dropdown
    const collaborators = await Collaborator.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    // Lấy tất cả danh mục với thông tin về cấu trúc cha-con
    const categories = await Category.findAll({
      attributes: ["id", "name", "parent_id"],
      order: [["name", "ASC"]],
    });

    res.render("products/edit", {
      title: `Chỉnh sửa sản phẩm: ${product.title}`,
      active: "products",
      product,
      collaborators,
      categories,
    });
  } catch (err) {
    console.error("Product edit form error:", err);
    res.status(500).render("error", {
      message: "Không thể tải form chỉnh sửa sản phẩm",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
});

// POST /products - Tạo sản phẩm mới
router.post(
  "/",
  authMiddleware.isAuth,
  cloudinaryUploadMiddleware.uploadProductImages,
  productController.createProduct
);

// PUT /products/:id - Cập nhật sản phẩm
router.put(
  "/:id",
  authMiddleware.isAuth,
  cloudinaryUploadMiddleware.uploadProductImages,
  productController.updateProduct
);

// DELETE /products/:id - Xóa sản phẩm
router.delete(
  "/:id",
  authMiddleware.isAuth,
  authMiddleware.isAdmin,
  productController.deleteProduct
);

module.exports = router;
