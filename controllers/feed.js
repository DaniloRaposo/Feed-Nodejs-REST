const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const Post = require("../models/post");
const User = require("../models/user");
const io = require("../socket");

const NUMBER_POSTS_PAGE = 2;

exports.getPosts = (req, res, next) => {
  page = Number(req.query.page) || 1;
  let totalItems;

  Post.find()
    .countDocuments()
    .then((numberDocuments) => {
      totalItems = numberDocuments;

      return Post.find()
        .populate("creator")
        .sort({ createdAt: -1 })
        .skip((page - 1) * NUMBER_POSTS_PAGE)
        .limit(NUMBER_POSTS_PAGE);
    })
    .then((posts) => {
      res.status(200).json({
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const image = req.file;

  const errors = validationResult(req);

  let creator;

  if (!errors.isEmpty() || !image) {
    const error = new Error("Validation fail");
    error.statusCode = 422;
    throw error;
  }

  const post = new Post({
    title: title,
    content: content,
    imageUrl: image.path,
    creator: req.userId,
  });

  post
    .save()
    .then(() => {
      return User.findById(req.userId);
    })
    .then((user) => {
      if (!user) {
        const error = new Error("Authenticated user not found");
        error.statusCode = 404;
        throw error;
      }

      user.posts.push(post);
      creator = user;
      return user.save();
    })
    .then(() => {
      io.getIO().emit("posts", {
        action: "create",
        post: {
          ...post._doc,
          creator: {
            _id: creator._id,
            name: creator.name,
          },
        },
      });

      res.status(201).json({
        message: "Post created",
        post: post,
        creator: {
          _id: creator._id,
          name: creator.name,
        },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .populate("creator")
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const deleteFile = (filePath) => {
  const fPath = path.join(__dirname, "..", filePath);

  fs.unlink(fPath, (err) => {
    console.log(err);
  });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  const errors = validationResult(req);
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error("Image not found");
    error.statusCode = 422;
    throw error;
  }

  if (!errors.isEmpty()) {
    const error = new Error("Validation fail");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .populate("creator")
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }

      if (post.creator._id.toString() !== req.userId) {
        const error = new Error("Unauthorized user");
        error.statusCode = 403;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        deleteFile(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((updatedPost) => {
      io.getIO().emit("posts", { action: "update", post: updatedPost });
      res.status(200).json({ message: "Post updated", post: updatedPost });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }

      if (post.creator.toString() !== req.userId) {
        const error = new Error("Unauthorized user");
        error.statusCode = 403;
        throw error;
      }

      deleteFile(post.imageUrl);

      return Post.findByIdAndDelete(postId);
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(() => {
      io.getIO().emit("posts", { action: "delete", post: postId });
      res.status(200).json({ message: "Post deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.updateStatus = (req, res, next) => {
  const status = req.body.status;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation error");
    error.statusCode = 422;
    throw error;
  }

  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      user.status = status;
      return user.save();
    })
    .then(() => {
      res.status(200).json({ status: status, message: "Status updated" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};
