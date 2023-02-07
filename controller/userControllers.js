const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/generateToken");
const User = require("../models/userModel");
const cloudinary = require("cloudinary");
const { sendEmail } = require("../config/sendemail");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, profile_pic, profile_pic_public_id } =
    req.body;
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
      profile_pic_public_id,
    });

    if (newUser) {
      // console.log("usercontroller", newUser.password);
      const generatedToken = generateToken(newUser._id);

      const verificationLink =
        "http://localhost:3000/user/" +
        newUser._id +
        "/verify/" +
        Date.now().toString();

      sendEmail(
        newUser.email,
        "Verify email address",
        `Please click on below link to verify your email address \n${verificationLink}`
      );
      res.status(200).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profile_pic: newUser.profile_pic,
        token: generatedToken,
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
  if (!user?.is_email_verified) {
    const verificationLink =
      "http://localhost:3000/user/" +
      user._id +
      "/verify/" +
      Date.now().toString();

    sendEmail(
      user.email,
      "Verify email address",
      `Please click on below link to verify your email address \n${verificationLink}`
    );
    res.status(400).json({
      is_email_verified: false,
      userId: user._id,
    });
  }

  //   matchPasssword function is part of userModel file, however while refering we are referring to "user" in above line
  // since we need to run function matchpassword for user (with given email exists in db)
  if (user && (await user.matchPassword(password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profile_pic: user.profile_pic,
      profile_pic_public_id: user?.profile_pic_public_id,
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

const updateProfilePic = asyncHandler(async (req, res) => {
  const { loggeduser_id, profilePic, profile_pic_public_id } = req.body;
  try {
    cloudinary.config({
      cloud_name: "dikosnerx",
      api_key: "996965522647276",
      api_secret: "POzroGMBAjmUb5gkScKrhK0Tipw",
    });

    const removePrevProfilepic_id = req.user?.profile_pic_public_id;
    if (removePrevProfilepic_id) {
      cloudinary.uploader
        .destroy(removePrevProfilepic_id, function (error, result) {
          // console.log(result, error);
        })
        // .then((resp) => console.log(resp))
        .catch((_err) =>
          console.log("Something went wrong, please try again later.")
        );
    }

    await User.findByIdAndUpdate(loggeduser_id, {
      $set: {
        profile_pic: profilePic,
        profile_pic_public_id: profile_pic_public_id,
      },
    });
    const updatedUserDetails = await User.findById(loggeduser_id);
    return res.status(200).json(updatedUserDetails);
  } catch (error) {
    console.log(error);
    return res.status(401).json({ msg: "Update failed" });
  }
});

const deleteProfilPicture = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  try {
    cloudinary.config({
      cloud_name: "dikosnerx",
      api_key: "996965522647276",
      api_secret: "POzroGMBAjmUb5gkScKrhK0Tipw",
    });

    cloudinary.uploader
      .destroy(req.user?.profile_pic_public_id, function (error, result) {
        // console.log(result, error);
      })
      // .then((resp) => console.log(resp))
      .catch((_err) =>
        console.log("Something went wrong, please try again later.")
      );
    const updatedData = await User.findByIdAndUpdate(userId, {
      $set: { profile_pic: null, profile_pic_public_id: null },
    });
    if (updatedData) {
      return res.status(200).json({ isProfilePictureDeleted: true });
    } else {
      return res.status(400).json({ isProfilePictureDeleted: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ msg: "Profile picture cannot be deleted" });
  }
});

const verifyEmailAddress = asyncHandler(async (req, res) => {
  try {
    const timestamp = new Date(parseInt(req.params.timestamp, 10));
    if (isNaN(timestamp.getTime())) {
      return res.status(400).json({
        message: "Invalid verification link.",
        validUrl: 2,
      });
    }
    const current = Date.now();
    const diff_in_milli = current - timestamp;
    const diff_in_minutes = diff_in_milli / (1000 * 60);
    if (diff_in_minutes > 5 || diff_in_minutes < 0) {
      return res.status(400).json({
        message: "Ooops!! This link is already expired.",
        validUrl: 2,
      });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Oopss!!! Invalid link!!", validUrl: 2 });
    }
    if (user.is_email_verified) {
      return res.status(400).json({
        message: "This email address has already been verified",
        validUrl: 4,
      });
    }

    await User.findByIdAndUpdate(req.params.id, {
      $set: { is_email_verified: true },
    });

    return res
      .status(200)
      .json({ message: "Email has been successfully verified", validUrl: 1 });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ message: "Unexpected Error Occurred", validUrl: 2 });
  }
});

module.exports = {
  registerUser,
  authUser,
  allUsers,
  updateProfilePic,
  deleteProfilPicture,
  verifyEmailAddress,
};
// express async handler package handles all errors
