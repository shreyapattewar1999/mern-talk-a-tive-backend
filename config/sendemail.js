const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const sendEmail = async (receipent_email, subject, msg_text) => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    // service: process.env.SERVICE,
    // port: Number(process.env.EMAIL_PORT),
    // secure: Boolean(process.env.SECURE),
    auth: {
      type: "login", // default
      user: process.env.USER,
      pass: process.env.PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.USER,
    to: receipent_email,
    subject: subject,
    text: msg_text,
  });
};

module.exports = { sendEmail };
