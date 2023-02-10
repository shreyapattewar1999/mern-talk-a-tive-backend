const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  updateProfilePic,
  deleteProfilPicture,
  verifyEmailAddress,
  updatePassword,
  generate_send_otp,
  verifyOtp,
} = require("../controller/userControllers");

const { protect } = require("../middlewear/authMiddlewear");
const router = express.Router();

router.route("/login").post(authUser);

router.route("/").post(registerUser).get(protect, allUsers);

router.route("/updatepicture").put(protect, updateProfilePic);

router.route("/deletepicture").delete(protect, deleteProfilPicture);

router.route("/updatepassword").put(updatePassword);

router.route("/generateOtp").post(generate_send_otp);

router.route("/verifyOtp").post(verifyOtp);

router.route("/:id/verify/:timestamp").get(verifyEmailAddress);

// Above line refers to 2 routes
// 1. router.route("/").post(registerUser)
// 2. router.route("/").get(protect, allUsers);

module.exports = router;
