require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");

const feedRouter = require("./routes/feed");
const authRouter = require("./routes/auth");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const acceptedFileTypes = ["image/png", "image/jpg", "image/jpeg"];

  cb(null, acceptedFileTypes.includes(file.mimetype));
};

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  next();
});

app.use("/feed", feedRouter);
app.use("/auth", authRouter);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;

  res.status(status).json({ message: message });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const server = app.listen(process.env.PORT);
    require("./socket").init(server);
  })
  .catch((err) => {
    console.log(err);
  });
