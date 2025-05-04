const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const cloudinaryUpload = require("../middlewares/cloudinaryUploadMiddleware");

// ------ Web View Routes ------

// Public web views - no authentication needed
router.get("/", postController.getPostsAdmin);
router.get("/:id/details", postController.getPostDetails);
router.get("/new", postController.getNewPostPage);
router.get("/:id/edit", postController.getEditPostForm);

// ------ API Routes ------

// Public API endpoints
router.get("/api/posts", postController.getAllPosts);
router.get("/api/posts/:id", postController.getPostById);

// Create new post - no authentication needed since user is already logged in
router.post(
  "/new",
  cloudinaryUpload.uploadProductImages,
  postController.createPost
);

// Update post - no authentication needed since user is already logged in
router.put(
  "/:id",
  cloudinaryUpload.uploadSingleImage,
  postController.updatePost
);

// Delete post - no authentication needed since user is already logged in
router.delete("/:id", postController.deletePost);

// ------ Admin Only Routes ------

// Change post status (admin only)
router.patch(
  "/:id/status",
  authMiddleware.restrictTo("admin"),
  postController.updatePostStatus
);

// Pin/unpin post (admin only)
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
