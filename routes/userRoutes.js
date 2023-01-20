const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
} = require("../controller/userControllers");

const { protect } = require("../middlewear/authMiddlewear");
const router = express.Router();

router.route("/login").post(authUser);

router.route("/").post(registerUser).get(protect, allUsers);
// Above line refers to 2 routes
// 1. router.route("/").post(registerUser)
// 2. router.route("/").get(protect, allUsers);

module.exports = router;
