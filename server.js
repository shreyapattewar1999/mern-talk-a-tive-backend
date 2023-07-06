const express = require("express");
const path = require("path");
const __dirname1 = path.resolve();
// dotenv library is required to access .env file
const dotenv = require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middlewear/errorMiddlewear");
const { addNotification1 } = require("./controller/messageController");
const app = express();
var cors = require("cors");

app.options("*", cors());

// app.use(
//   cors({
//     credentials: true,
//     preflightContinue: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     origin: true,
//   })
// );
// var allowCrossDomain = function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization, X-Requested-With, token"
//   );
//   if (req.method.toLowerCase() == "options") res.writeHead(200);
//   next();
// };
// app.use(allowCrossDomain);
const PORT = process.env.PORT || 5000;

app.use(express.json()); // to accept JSON Requests
// console.log(path.join(__dirname1, "build", "index.html"));
app.use(express.static(path.resolve(__dirname1, "build")));
app.use(express.static(path.resolve(__dirname1, "public")));

connectDB();

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.get("/api/test", (req, res) => {
  // const userDetails = req.body;
  // console.log("window closing");
  // console.log(userDetails);
  res.sendStatus(200);
});
app.get("*", (req, res, next) => {
  res.sendFile(path.resolve(__dirname1, "build", "index.html"));
});

const server = app.listen(
  5000,
  console.log("server started on " + PORT.toString())
);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/frontend/build")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
//   });
// } else {
//   app.get("/", (req, res) => {
//     res.send("Api running successfully");
//   });
// }

app.use(notFound);
app.use(errorHandler);

let alreadyPresentNotifications = new Set();

const addNotificationInDb = async (notificationToBeAdded) => {
  try {
    if (alreadyPresentNotifications.has(notificationToBeAdded._id)) {
      return;
    }

    alreadyPresentNotifications.add(notificationToBeAdded._id);
    const usersToBeNotified = [];

    notificationToBeAdded.chat.users.forEach((user) => {
      if (user._id.toString() !== notificationToBeAdded.sender._id.toString()) {
        usersToBeNotified.push(user._id);
      }
    });
    const requestBody = {
      chatId: notificationToBeAdded.chat._id,
      isGroupChat: notificationToBeAdded.chat.isGroupChat,
      content: notificationToBeAdded.content,
      senderId: notificationToBeAdded.sender._id,
      users: usersToBeNotified,
    };
    await addNotification1(requestBody);
  } catch (error) {
    // console.log(error);
  }
};

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

let online_users = [];
io.on("connection", (socket) => {
  // for every user there should be unique socket running
  // here front end will send user details and join the room
  // we are creating new room for each user
  // "setup" is name given to this particular socket
  socket.on("user loggedin", (userData) => {
    // console.log("joining", userData._id);

    const isIncomingUserExist = online_users.find((uId) => uId == userData._id);

    if (isIncomingUserExist === undefined || isIncomingUserExist === null) {
      online_users.push(userData._id);
    }
    io.emit("get-online-users", online_users);
  });

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (roomId) => {
    socket.join(roomId);
    console.log("User joined room with id = " + roomId);
    // socket.emit("connected");
  });

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) {
      return console.log("this chat does not have any users");
    }

    chat.users.forEach(async (user) => {
      if (user._id != newMessageReceived.sender._id) {
        // if this message belongs to current sender then no need to receive this message again
        socket.in(user._id).emit("message received", newMessageReceived);
        await addNotificationInDb(newMessageReceived);
        // this refers to if both users are online and have opened chat then messages are seen so no need to add in db
        // if (newMessageReceived.chat._id !== selectedChat._id) {
        //   await addNotificationInDb(newMessageReceived);
        // }
      }
    });
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("logout-current-user", (currentUserId) => {
    online_users = online_users.filter((uid) => uid !== currentUserId);
    io.emit("get-online-users", online_users);

    //  cleaning up sockets to reduce bandwidth
    socket.leave(currentUserId);
    // console.log(io.sockets.adapter.rooms);
  });
  // cleaning up sockets to reduce bandwidth
  // socket.off("setup", () => {
  //   console.log("USER DISCONNECTED");
  // });
});
