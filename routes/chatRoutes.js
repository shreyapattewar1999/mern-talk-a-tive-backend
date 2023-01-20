const express = require("express");
const { protect } = require("../middlewear/authMiddlewear");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
} = require("../controller/chatsController");

const router = express.Router();

router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/group/rename").put(protect, renameGroup);
router.route("/group/remove").put(protect, removeFromGroup);
router.route("/group/add").post(protect, addToGroup);

module.exports = router;
