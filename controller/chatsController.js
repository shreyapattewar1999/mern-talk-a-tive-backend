const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res
      .status(400)
      .json({ message: "UserId param not sent with request" });
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: userId } } },
      { users: { $elemMatch: { $eq: req.user._id } } },
    ],
  })
    .populate("users", "-password")
    .populate("lastMessage");

  isChat = await User.populate(isChat, {
    path: "lastMessage.sender",
    select: "name profile_pic email",
  });

  if (isChat.length > 0) {
    return res.status(200).json({ chat: isChat[0] });
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      return res.status(200).json({ chat: fullChat });
    } catch (error) {
      return res.status(500).json({ msg: "Internal Server Error", error });
    }
  }
});

const fetchChats = asyncHandler((req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 }) //sort chats descendingly
      .then(async (result) => {
        result = await User.populate(result, {
          path: "lastMessage.sender",
          select: "name profile_pic email",
        });
        return res.status(200).json({ chat: result });
      });
  } catch (error) {}
});

const createGroupChat = asyncHandler(async (req, res) => {
  var { name, users } = req.body;
  if (!name || !users) {
    return res.status(400).json({ message: "Please fill all the details" });
  }

  const chatName = name;
  users = JSON.parse(users);
  if (users.length < 2) {
    return res.status(400).json({ message: "Please add more users" });
  }

  users.push(req.user);
  try {
    const groupChat = await Chat.create({
      chatName,
      users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fectchGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    return res.status(200).json({ groupChat: fectchGroupChat });
  } catch (error) {
    return res.status(400).json({ message: "Internal Server Error", error });
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  try {
    // new: true --> returns updated chat with updated name
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    return res.status(200).json({ updatedChat });
  } catch (error) {
    return res.status(400).json({ message: "Internal Server Error" });
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    return res.status(200).json({ updatedChat: added });
  } catch (error) {
    return res.status(400).json({ message: "Internal Server Error" });
  }
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    return res.status(200).json({ updatedChat: removed });
  } catch (error) {
    return res.status(400).json({ message: "Internal Server Error" });
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
};
