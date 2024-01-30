const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const authenticated = require("../middleware/isAuth");

const router = express.Router();

// GET /feed/post
router.get("/post", authenticated, feedController.getPosts);
// POST /feed/post
router.post(
  "/post",
  authenticated,
  [
    body("title", "Title too short").trim().isLength({ min: 5 }),
    body("content", "Content too short").trim().isLength({ min: 5 }),
  ],
  feedController.postPost
);
// GET /feed/post/:postId
router.get("/post/:postId", authenticated, feedController.getPost);
// PUT /feed/post/:postId
router.put(
  "/post/:postId",
  authenticated,
  [
    body("title", "Title too short").trim().isLength({ min: 5 }),
    body("content", "Content too short").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);
// DELETE /feed/post/:postId
router.delete("/post/:postId", authenticated, feedController.deletePost);

// GET /feed/status
router.get("/status", authenticated, feedController.getStatus);

// PUT /feed/status
router.put(
  "/status",
  body("status", "Status can not be empty").trim().notEmpty(),
  authenticated,
  feedController.updateStatus
);

module.exports = router;
