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

// remove notifications from top when clicked on notification box in UI
router.route("/notification/remove").put(protect, deleteNotification);

// clear all messages in particular chat
router.route("/clearMessages/:chatId").delete(protect, clearMessages);

// to delete particular message
router.route("/delete/:messageId").delete(protect, deleteMessage);

// to edit particular message
router.route("/edit/:messageId").put(protect, editMessage);

module.exports = router;
