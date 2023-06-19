const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const { Message } = require("../models/messageModel");
const { Notification } = require("../models/notificationModel");
const mongoose = require("mongoose");

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res
      .status(400)
      .json({ message: "Invalid data passed into request" });
  }

  var newMessage = {
    sender: req.user._id,
    content,
    chat: chatId,
  };

  try {
    var createdMessage = await Message.create(newMessage);
    // here we are populating instance of mongoose class
    createdMessage = await createdMessage.populate({
      path: "sender",
      select: "-password",
    });

    createdMessage = await createdMessage.populate("chat");
    createdMessage = await createdMessage.populate({
      path: "chat.users",
      select: "-password",
    });
    // console.log(createdMessage);

    await Chat.findByIdAndUpdate(req.body.chatId, {
      lastMessage: createdMessage,
    });

    return res.status(200).json({ createdMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Internal Server Error", error });
  }
});

const getAllMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "-password")
      .populate("chat");
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({ msg: "Internal Server Error", error });
  }
});

const addNotification = asyncHandler(async (req, res) => {
  const { chatId, content, senderId, isGroupChat, users } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res
      .status(400)
      .json({ message: "Invalid data passed into request" });
  }

  var newNotification = {
    sender: senderId,
    content,
    chat: chatId,
    users,
  };

  try {
    var createdNotification = await Notification.create(newNotification);

    // here we are populating instance of mongoose class

    createdNotification = await createdNotification.populate(
      "sender",
      "-password"
    );
    createdNotification = await createdNotification.populate("chat");
    createdNotification = await createdMessage.populate({
      path: "chat.users",
      select: "-password",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      lastMessage: createdMessage,
    });

    return res.status(200).json({ createdNotification });
  } catch (error) {
    console.log(error?.response?.data);
    return res.status(500).json({ msg: "Internal Server Error", error });
  }
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { chatId, isGroupChat } = req.body;
  try {
    // users: specifiy list of users to be notified OR list of users who should receieve notification of current message
    // the below line is Imp because sometimes while in group chat messages, we go on PULLING users from users list
    // and at some point for particular notifications, users list is empty but document is still present in DB
    // to remove all such documents we had written below statement which states that
    // remove all documents in which users list exists and size of list is 0
    await Notification.deleteMany({ users: { $exists: true, $size: 0 } });

    if (isGroupChat) {
      // in case of group chats user1 has dropped msg on group1, and group1 has 4 members
      // now user2 logs in, user2 is part of group1, and user2 received notification, once he clicks on the notification
      // then the next time when user2 logs in he should not receieve same notification hence we remove user2 from list of users to be notified
      // with the help of pull operation
      const updatedNotification = await Notification.updateMany(
        { chat: chatId },
        {
          $pull: { users: req.user._id },
        }
      );
      return res.status(200).json({
        message: "Notification removed for current user",
        updatedNotification,
      });
    } else {
      // if notification is for one to one chat, after seeing/clicking on notification, it has to be deleted from DB
      const deletedNotification = await Notification.deleteMany({
        chat: mongoose.Types.ObjectId(chatId),
      });

      if (deletedNotification.deletedCount > 0) {
        return res
          .status(200)
          .json({ message: "Notification has been deleted successfully" });
      } else {
        return res.status(400).json({
          message: "Such chat does not exist, notification is not deleted",
        });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: "Internal Server Error", error });
  }
});
const removeNotification = asyncHandler(async (req, res) => {
  // const { notificationIds } = req.body;
  const { chatId, isGroupChat } = req.body;

  try {
    if (isGroupChat) {
      var notficationToBeUpdated = await Notification.findOne({
        chat: chatId,
      }).populate({
        path: "chat",
        populate: { path: "users", select: "-password" },
      });
      // var notficationToBeUpdated = await Notification.findOne({
      //   chat: chatId,
      // }).populate("chat");

      // notficationToBeUpdated = await User.populate(removed, {
      //   path: "chat.users",
      //   select: "-password",
      // });

      notficationToBeUpdated.chat.users =
        notficationToBeUpdated.chat.users.filter(
          (user) => user._id !== req.user._id
        );

      const updatedNotification = await Notification.findOneAndReplace(
        { chat: chatId },
        notficationToBeUpdated
      );
      // for (let index = 0; index < populatedData.length; index++) {
      //   const element = populatedData[index].chat.users;
      //   if (populatedData[index].chat._id === chatId) {
      //     populatedData[index].chat.users = element.filter(
      //       (user) => user._id !== req.user._id
      //     );
      //   }
      // }

      // var createdNotification = await Notification.create(
      //   notficationToBeUpdated
      // );

      return res.status(200).json({
        message: "Notification removed for current user",
        updatedNotification,
      });
    } else {
      // const deletedNotifications = [];
      // for (let index = 0; index < notificationIds.length; index++) {
      //   const element = notificationIds[index];
      //   console.log(element);
      //   objectIds.push(new mongoose.Types.ObjectId(element?._id));
      // }
      const deletedNotification = await Notification.deleteOne({
        chat: chatId,
      });
      // const deletedNotifications = await Notification.deleteMany({
      //   _id: { $in: notificationIds },
      // });
      // for (let index = 0; index < notificationIds.length; index += 1) {
      //   const notificationId = notificationIds[index];
      //   const removedNotification = await Notification.findByIdAndDelete(
      //     notificationId
      //   );
      //   deletedNotifications.push(removeNotification);
      // }
      if (deletedNotification.deletedCount > 0) {
        return res
          .status(200)
          .json({ message: "Notification has been deleted successfully" });
      } else {
        return res.status(400).json({
          message: "Such chat does not exist, notification is not deleted",
        });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: "Internal Server Error", error });
  }
});

const getAllNotifications = asyncHandler(async (req, res) => {
  try {
    const notificationsWithUsers = await Notification.find({
      users: req.user._id,
    })
      .populate({
        path: "chat",
        populate: { path: "users", select: "-password" },
      })
      .populate({
        path: "users",
      })
      .populate("sender", "-password");

    // const notificationsWithUsers = await User.populate(notifications, {
    //   path: "chat.users",
    //   select: "-password",
    // });
    // const loggedUserId = req.user._id;

    // let result = [];
    // for (let index = 0; index < notificationsWithUsers.length; index++) {
    //   const element = notificationsWithUsers[index];
    //   if (element?.sender?._id.toString() === loggedUserId.toString()) {
    //     continue;
    //   } else {
    //     const usersList = element.users.map((user) => user._id.toString());
    //     if (usersList.includes(loggedUserId)) {
    //       result.push(element);
    //       break;
    //     }
    //   }
    // }

    // for (let index = 0; index < notificationsWithUsers.length; index += 1) {
    //   const element = notificationsWithUsers[index];
    //   if (element?.sender?._id.toString() === loggedUserId.toString()) {
    //     continue;
    //   }
    //   for (let i = 0; i < element?.chat?.users.length; i += 1) {
    //     const currentUser = element?.chat?.users[i];
    //     if (currentUser?._id.toString() === loggedUserId.toString()) {
    //       result.push(element);
    //       break;
    //     }
    //   }
    // }
    // console.log(notificationsWithUsers, loggedUserId);
    return res.status(200).json({ notifications: notificationsWithUsers });
  } catch (error) {
    return res.status(400).json({ msg: "Internal Server Error", error });
  }
});
module.exports = {
  getAllMessages,
  sendMessage,
  addNotification,
  removeNotification,
  getAllNotifications,
  deleteNotification,
};
