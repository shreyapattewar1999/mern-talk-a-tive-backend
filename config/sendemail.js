const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const sendEmail = async (receipent_email, subject, msg_text) => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    service: process.env.SERVICE,
    // port: Number(process.env.EMAIL_PORT),
    // secure: Boolean(process.env.SECURE),
    auth: {
      type: "login", // default
      user: process.env.USER,
      pass: "ldvgiauvhlonrlrf",
    },
  });

  await transporter.sendMail({
    from: process.env.USER,
    to: receipent_email,
    subject: subject,
    text: msg_text,
  });
  //   var transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: "pattewarpradeep@gmail.com",
  //       pass: "Pra@1449260",
  //     },
  //   });
  //   var mailOptions = {
  //     from: "pattewarpradeep@gmail.com",
  //     to: newUser.email,
  //     subject: "Verify Email Id",
  //     text: `Please click on below link to verify your email address \n${verificationLink}`,
  //   };

  // transporter.sendMail(mailOptions, function (error, info) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log("Email sent: " + info.response);
  //   }
  // });
};

module.exports = { sendEmail };
