const express = require("express");
const cors = require("cors");
const path = require("path");
const layouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("express-flash");
const methodOverride = require("method-override");

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const productApiRoutes = require("./routes/productApiRoutes");
const postRoutes = require("./routes/postRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const collaboratorRoutes = require("./routes/collaboratorRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { sequelize } = require("./config/database");
const { protect } = require("./middlewares/authMiddleware");

// Initialize express app
const app = express();

// Environment variables
const isProd = process.env.NODE_ENV === "production";
const isOnCPanel = process.env.ON_CPANEL === "true";

// Set the base URL for static assets based on environment
const BASE_URL = isOnCPanel ? "/public" : "";

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(layouts);
app.set("layout", "layouts/main");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up method override for PUT, DELETE methods in forms
app.use(methodOverride("_method"));

// Session configuration
app.use(
  session({
    secret: "nhangonsaigon-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Không yêu cầu HTTPS trong môi trường phát triển
      maxAge: 24 * 60 * 60 * 1000, // Cookie hết hạn sau 1 ngày
    },
  })
);

// Flash messages
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.info = req.flash("info");
  res.locals.warning = req.flash("warning");

  // Add baseUrl for static assets to all views
  res.locals.baseUrl = BASE_URL;

  next();
});

// Serve static files
app.use("/public", express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../public")));

// Initialize models
require("./models/index");

// Authentication routes (no layout for auth pages)
app.use(
  "/auth",
  (req, res, next) => {
    app.set("layout", false); // Disable layout for auth pages
    next();
  },
  authRoutes
);

// Set default layout back to main for other routes
app.use((req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  app.set("layout", "layouts/main");
  next();
});

// Mock user for development - Only enable this when working on protected routes
// Remove or comment this out when implementing actual authentication
/*
app.use((req, res, next) => {
  // Skip for auth routes
  if (req.path.startsWith('/auth')) return next();
  
  // Set mock user for other routes during development
  req.user = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    avatar: null
  };
  res.locals.user = req.user;
  res.locals.active = '';
  res.locals.title = 'Admin Dashboard';
  next();
});
*/

// Middleware để kiểm tra và đặt thông tin người dùng
app.use((req, res, next) => {
  // Kiểm tra xem người dùng đã đăng nhập chưa qua session
  if (req.session && req.session.user) {
    // Gắn thông tin người dùng vào req.user để sử dụng trong các middleware và controller
    req.user = req.session.user;
    // Gắn thông tin người dùng vào res.locals để sử dụng trong các view
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }

  // Đặt các giá trị mặc định khác
  res.locals.active = "";
  res.locals.title = "Admin Dashboard";

  next();
});

// Web routes
app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

// Thêm route /login
app.get("/login", (req, res) => {
  res.redirect("/auth/login");
});

// Thêm route /logout
app.get("/logout", (req, res) => {
  res.redirect("/auth/logout");
});

// Routes được bảo vệ (yêu cầu xác thực)
app.use("/dashboard", protect, dashboardRoutes);
app.use("/collaborators", protect, collaboratorRoutes);
app.use("/products", protect, productRoutes);
app.use("/posts", protect, postRoutes);
app.use("/categories", protect, categoryRoutes);

// API routes
app.use("/api/auth", authRoutes);

// Sử dụng productApiRoutes thay vì định nghĩa trực tiếp
app.use("/api/products", protect, productApiRoutes);

// Posts API routes
const postApiRouter = express.Router();
postApiRouter.get("/", async (req, res) => {
  try {
    const { Post } = require("./models/index");
    const posts = await Post.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
postApiRouter.get("/:id", async (req, res) => {
  try {
    const { Post } = require("./models/index");
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bài viết" });
    }
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.use("/api/posts", protect, postApiRouter);

// Categories API routes
const categoryApiRouter = express.Router();
categoryApiRouter.get("/", async (req, res) => {
  try {
    const { Category } = require("./models/index");

    // Sửa lại include để sử dụng alias chính xác là "parentCategory"
    // thay vì "parent" như trước đây
    const categories = await Category.findAll({
      include: [
        {
          model: Category,
          as: "parentCategory",
          required: false,
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm endpoint lấy chi tiết một category theo ID
categoryApiRouter.get("/:id", async (req, res) => {
  try {
    const { Category, Product } = require("./models/index");

    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: "parentCategory",
          required: false,
        },
        {
          model: Category,
          as: "childCategories",
          required: false,
        },
        {
          model: Product,
          as: "products",
          required: false,
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục này",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use("/api/categories", protect, categoryApiRouter);

// Collaborators API routes
const collaboratorApiRouter = express.Router();
collaboratorApiRouter.get("/", async (req, res) => {
  try {
    const { Collaborator, Product } = require("./models/index");
    const collaborators = await Collaborator.findAll({
      include: [{ model: Product, as: "products", required: false }],
    });
    res.json({ success: true, data: collaborators });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.use("/api/collaborators", protect, collaboratorApiRouter);

// Dashboard API routes
const dashboardApiRouter = express.Router();
dashboardApiRouter.get("/stats", async (req, res) => {
  try {
    const { Product, Post, Collaborator } = require("./models/index");
    const stats = {
      totalProducts: await Product.count(),
      discountedProducts: await Product.count({
        where: { status: "discounted" },
      }),
      totalPosts: await Post.count(),
      totalCollaborators: await Collaborator.count(),
    };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.use("/api/dashboard", protect, dashboardApiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);

  if (req.xhr || req.path.startsWith("/api")) {
    res.status(statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? "" : err.stack,
    });
  } else {
    res.status(statusCode).render("error", {
      title: "Error",
      message: err.message,
      error: process.env.NODE_ENV === "production" ? {} : err,
    });
  }
});

module.exports = app;
