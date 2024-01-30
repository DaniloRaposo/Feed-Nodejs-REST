const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const HASH_SALT = 12;

exports.signup = (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    throw error;
  }

  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        const error = new Error("This email is been used");
        error.statusCode = 422;

        throw error;
      }

      return bcrypt.hash(password, HASH_SALT);
    })
    .then((hashPassword) => {
      const user = new User({
        email: email,
        name: name,
        password: hashPassword,
        posts: [],
      });

      return user.save();
    })
    .then((result) => {
      res
        .status(201)
        .json({ message: "User created", userId: result._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  let loggedUser;

  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    throw error;
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;

        throw error;
      }

      loggedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((passwordComparison) => {
      if (!passwordComparison) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;

        throw error;
      }

      const token = jwt.sign(
        {
          email: loggedUser.email,
          userId: loggedUser._id.toString(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({ token: token, userId: loggedUser._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};
