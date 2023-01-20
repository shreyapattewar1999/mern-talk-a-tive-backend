const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/generateToken");
const User = require("../models/userModel");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, profile_pic } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all fields");
  }

  const isUserExist = await User.findOne({ email });
  if (isUserExist !== null) {
    res.status(400);
    throw new Error("User already exists with this email id");
  } else {
    const newUser = await User.create({
      name,
      email,
      password,
      profile_pic,
    });

    if (newUser) {
      console.log("usercontroller", newUser.password);
      res.status(200).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profile_pic: newUser.profile_pic,
        token: generateToken(newUser._id),
      });
    } else {
      res.status(400).json("Failed to create user");
    }
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please enter all fields");
  }
  const user = await User.findOne({ email });

  //   matchPasssword function is part of userModel file, however while refering we are referring to "user" in above line
  // since we need to run function matchpassword for user (with given email exists in db)
  if (user && (await user.matchPassword(password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profile_pic: user.profile_pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json("invalid credentials");
  }
});

// /api/users?search=shreya

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search;
  if (keyword) {
    // options: "i" --> case sensitive comparison
    // or --> for searching keyword in name OR email
    const query = {
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    };
    // $ne --> no equal to
    // last find is to remove current logged in user from result of first query
    const matched_users = await User.find(query).find({
      _id: { $ne: req.user._id },
    });
    return res.status(200).json(matched_users);
  }
  return res.status(401).json({ msg: "results not found" });

  // console.log(req.query);
});
module.exports = { registerUser, authUser, allUsers };
// express async handler package handles all errors
