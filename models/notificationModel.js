const mongoose = require("mongoose");

const notificationModel = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    // users: specifiy list of users to be notified OR list of users who should receieve notification of current message
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationModel);
module.exports = { Notification };
