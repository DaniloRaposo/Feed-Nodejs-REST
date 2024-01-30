const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");

const router = express.Router();

// POST /auth/signup
router.post(
  "/signup",
  [
    body("email", "Invalid email sended").isEmail().normalizeEmail(),
    body("password", "Password too short").trim().isLength({ min: 5 }),
    body("name", "Name not sended").trim().notEmpty(),
  ],
  authController.signup
);
// POST /auth/login
router.post(
  "/login",
  [
    body("email", "Invalid email sended").isEmail().normalizeEmail(),
    body("password", "Password too short").trim().isLength({ min: 5 }),
  ],
  authController.login
);

module.exports = router;
