const jwt = require("jsonwebtoken");
const { User } = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      // console.log(decoded, req.user);

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized");
  }
});

module.exports = { protect };
