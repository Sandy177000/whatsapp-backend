import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";
import { Server } from "socket.io";

import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);

app.use(express.json());

app.use("/uploads/images", express.static("uploads/images"));
app.use("/uploads/recordings", express.static("uploads/recordings"));

app.use("/api/auth", AuthRoutes);
app.use("/api/messages", MessageRoutes);

const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

// creating socket server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // client
  },
});

// to maintain the track of online users globally
global.onlineUsers = new Map(); // userId : socketId

io.on("connection", (socket) => {
  global.chatSocket = socket;

  // listening to the event emitted from front-end assigns a user a socket id
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to); // getting the socket id using user id
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", {
        from: data.from,
        message: data.message,
      }); // sending the message to the particular user only
    }
  });

  socket.on("outgoing-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);

    if (sendUserSocket) {
      // listen to this event in frontend
      socket.to(sendUserSocket).emit("incoming-voice-call", {
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
    }
  });

  socket.on("outgoing-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);

    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-video-call", {
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
    }
  });

  socket.on("reject-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("voice-call-rejected", {});
    }
  });

  socket.on("reject-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    console.log(data);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("video-call-rejected", {});
    }
  });

  socket.on("accept-incoming-call", ({ id }) => {
    const sendUserSocket = onlineUsers.get(id);
    socket.to(sendUserSocket).emit("accept-call");
  });

  socket.on("signout", (id) => {
    onlineUsers.delete(id);
    socket.broadcast.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

// When a .emit is triggered the .on is used to listen to the event and perform operations
// When a user logs-in, a socket-id is generated
// add-user event is used to map the userId and the generated socketId
