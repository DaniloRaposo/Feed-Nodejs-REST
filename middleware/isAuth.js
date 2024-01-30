const jwt = require("jsonwebtoken");

const authenticated = (req, res, next) => {
  const token = req.get("Authorization")?.replace("Bearer ", "");
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    throw err;
  }

  if (!decodedToken) {
    const error = new Error("User not authenticated");
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
};

module.exports = authenticated;
