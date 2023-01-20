const express = require("express");
const { protect } = require("../middlewear/authMiddlewear");
const {
  getAllMessages,
  sendMessage,
} = require("../controller/messageController");

const router = express.Router();

// post new message
router.route("/").post(protect, sendMessage);

// fetch all messages for each chat
router.route("/:chatId").get(protect, getAllMessages);

module.exports = router;
