const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userModel = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile_pic: {
      type: String,
    },
    profile_pic_public_id: { type: String },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const otpModel = mongoose.Schema(
  {
    hashedOtp: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: true }
);

userModel.methods.matchPassword = async function (enteredPassword) {
  const isCompare = await bcrypt.compare(enteredPassword, this.password);
  return isCompare;
};

// before saving data to userModel, below function will run
userModel.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  } else {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

const User = mongoose.model("User", userModel);
const OTP_Model = mongoose.model("OTP_Model", otpModel);

module.exports = { User, OTP_Model };
