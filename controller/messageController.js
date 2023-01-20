const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel");

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
    createdMessage = await createdMessage.populate("sender", "-password");
    createdMessage = await createdMessage.populate("chat");

    // explain path here ??????????
    createdMessage = await User.populate(createdMessage, {
      path: "chat.users",
      select: "-password",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      lastMessage: createdMessage,
    });

    return res.status(200).json({ createdMessage });
  } catch (error) {}
  return res.status(500).json({ msg: "Internal Server Error", error });
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

module.exports = { getAllMessages, sendMessage };
