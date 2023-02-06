const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  updateProfilePic,
  deleteProfilPicture,
  verifyEmailAddress,
} = require("../controller/userControllers");

const { protect } = require("../middlewear/authMiddlewear");
const router = express.Router();

router.route("/login").post(authUser);

router.route("/").post(registerUser).get(protect, allUsers);

router.route("/updatepicture").put(protect, updateProfilePic);

router.route("/deletepicture").delete(protect, deleteProfilPicture);

router.route("/:id/verify").get(verifyEmailAddress);
// Above line refers to 2 routes
// 1. router.route("/").post(registerUser)
// 2. router.route("/").get(protect, allUsers);

module.exports = router;
