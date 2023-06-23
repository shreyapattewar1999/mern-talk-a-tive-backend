const express = require("express");
const { protect } = require("../middlewear/authMiddlewear");
const {
  getAllMessages,
  sendMessage,
  removeNotification,
  addNotification,
  getAllNotifications,
  deleteNotification,
  clearMessages,
  deleteMessage,
  editMessage,
} = require("../controller/messageController");

const router = express.Router();

// post new message
router.route("/").post(protect, sendMessage);

// fetch all messages for each chat
router.route("/:chatId").get(protect, getAllMessages);

// post notification
router.route("/notification/add").post(addNotification);

// fetch all notifications
router.route("/notification/fetch").get(protect, getAllNotifications);

router.route("/notification/remove").put(protect, deleteNotification);

router.route("/clearMessages/:chatId").delete(protect, clearMessages);

router.route("/delete/:messageId").delete(protect, deleteMessage);

router.route("/edit/:messageId").put(protect, editMessage);

module.exports = router;
