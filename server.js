const express = require("express");
// dotenv library is required to access .env file
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middlewear/errorMiddlewear");
const axios = require("axios");

const app = express();

app.use(express.json()); // to accept JSON Requests

connectDB();
dotenv.config();
const PORT = process.env.PORT;

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

let alreadyPresentNotifications = new Set();
// app.get("/", (req, res) => {
//   res.send("api running using nodemon ");
// });

// app.get("/api/chats", (req, res) => {
//   res.send(chats);
// });

// app.get("/api/chat/:id", (req, res) => {
//   const id = req.params.id;
//   const chatFound = chats.find((chat) => chat._id == id);
//   res.send(chatFound);
// });
const server = app.listen(
  5000,
  console.log("server started on " + PORT.toString())
);

const addNotificationInDb = async (notificationToBeAdded) => {
  // console.log(notificationToBeAdded);
  try {
    // const config = {
    //   headers: {
    //     "Content-type": "application/json",
    //     Authorization: `Bearer ${user.token}`,
    //   },
    // };

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
    const { data } = await axios.post(
      "http://localhost:5000/api/message/notification/add",
      requestBody
    );
  } catch (error) {
    console.log(error);
  }
};

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  // for every user there should be unique socket running
  // here front end will send user details and join the room
  // we are creating new room for each user
  // "setup" is name given to this particular socket
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    // console.log(userData);
    socket.emit("connected");
  });

  socket.on("join chat", (roomId) => {
    socket.join(roomId);
    console.log("User joined room with id = " + roomId);
    // socket.emit("connected");
  });

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    // console.log(newMessageReceived);

    if (!chat.users) {
      return console.log("this chat does not have any users");
    }

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) {
        // if this message belongs to current sender then no need to receive this message again
        return;
      } else {
        addNotificationInDb(newMessageReceived);
        socket.in(user._id).emit("message received", newMessageReceived);
      }
    });
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // cleaning up sockets to reduce bandwidth
  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
