const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      "mongodb+srv://shreyapattewar:xyz123@cluster0.bbif7rc.mongodb.net/?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Mongo DB Connected");
  } catch (error) {
    // console.log(error);
    process.exit();
  }
};

module.exports = connectDB;
