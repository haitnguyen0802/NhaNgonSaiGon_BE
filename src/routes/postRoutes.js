const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

// ------ Web View Routes ------

// Public web view for posts listing and details
router.get("/", postController.getPostsAdmin);
router.get("/:id/details", postController.getPostDetails);

// Form routes for creation and edit (requires auth)
router.get("/new", authMiddleware.protect, postController.getNewPostForm);
router.get("/:id/edit", authMiddleware.protect, postController.getEditPostForm);

// ------ API Routes ------

// Public API endpoints
router.get("/api/posts", postController.getAllPosts);
router.get("/api/posts/:id", postController.getPostById);

// ------ Protected Routes ------
router.use(authMiddleware.protect);

// Create new post
router.post(
  "/",
  uploadMiddleware.uploadPostImage,
  postController.resizePostImage,
  postController.createPost
);

// Handle specific post by ID
router
  .route("/:id")
  .put(
    uploadMiddleware.uploadPostImage,
    postController.resizePostImage,
    postController.updatePost
  )
  .delete(postController.deletePost);

// ------ Admin Only Routes ------

// Change post status
router.patch(
  "/:id/status",
  authMiddleware.restrictTo("admin"),
  postController.updatePostStatus
);

// Pin/unpin post
router.patch(
  "/:id/pin",
  authMiddleware.restrictTo("admin"),
  postController.togglePinPost
);

// Post statistics (admin only)
router.get(
  "/stats",
  authMiddleware.restrictTo("admin"),
  postController.getPostStats
);

module.exports = router;
