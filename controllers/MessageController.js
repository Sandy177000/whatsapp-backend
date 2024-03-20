import getPrismaInstance from "../utils/PrismaClient.js";
import { renameSync } from "fs";

export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { message, from, to } = req.body;
    const getUser = onlineUsers.get(to); // check if receiver is online from the map

    if (message && from && to) {
      const newMessage = await prisma.messages.create({
        data: {
          message,
          sender: { connect: { id: from } },
          receiver: { connect: { id: to } },
          messageStatus: getUser ? "delivered" : "sent",
        },

        include: { sender: true, receiver: true },
      });

      return res.status(201).send({ message: newMessage });
    }

    return res.status(400).send("from to and message is required");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// getting all the messages between two users
export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.params;

    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          {
            senderId: from,
            receiverId: to,
          },
          {
            senderId: to,
            receiverId: from,
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });

    const unreadMessages = [];

    // marking all the messages which are not read but are delivered by the sender as read
    messages.forEach((message, index) => {
      if (message.messageStatus !== "read" && message.senderId === to) {
        messages[index].messageStatus = "read";
        unreadMessages.push(message.id);
      }
    });

    // update the unread message status in database
    await prisma.messages.updateMany({
      where: {
        id: { in: unreadMessages },
      },
      data: {
        messageStatus: "read",
      },
    });

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
    console.log(error);
  }
};

export const getMessages1 = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.body;

    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          {
            senderId: from,
            receiverId: to,
          },
          {
            senderId: to,
            receiverId: from,
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });

    const unreadMessages = [];

    // marking all the messages which are not read but are delivered by the sender as read
    messages.forEach((message, index) => {
      if (message.messageStatus !== "read" && message.senderId === to) {
        messages[index].messageStatus = "read";
        unreadMessages.push(message.id);
      }
    });

    // update the unread message status in database
    await prisma.messages.updateMany({
      where: {
        id: { in: unreadMessages },
      },
      data: {
        messageStatus: "read",
      },
    });

    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
    console.log(error);
  }
};



export const addImageMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();

      // creating path name where the images whose uploading is handled by the multer
      let fileName = "uploads/images/" + date + req.file.originalname; // multer provides this

      renameSync(req.file.path, fileName); //renaming the image from frontend to created name

      const prisma = getPrismaInstance();

      const { from, to } = req.query;
      const getUser = onlineUsers.get(to); // check if receiver is online from the map

      // storing the link of the image as a message in db
      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: fileName,
            sender: { connect: { id: from } },
            receiver: { connect: { id: to } },
            messageStatus: getUser ? "delivered" : "sent",
            type: "image",
          },
        });

        return res.status(201).json({ message });
      }

      return res.status(400).send("from, to is required");
    }
    return res.status(400).send("Image is required");
  } catch (error) {
    next(error);
  }
};

export const addAudioMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();

      // creating path to the audio file
      let fileName = "uploads/recordings/" + date + req.file.originalname; // multer provides this

      renameSync(req.file.path, fileName); //renaming the file from frontend to created name

      const prisma = getPrismaInstance();

      const { from, to } = req.query;
      const getUser = onlineUsers.get(to); // check if receiver is online from the map

      // storing the path of the audio as a message in db

      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: fileName,
            sender: { connect: { id: from } },
            receiver: { connect: { id: to } },
            messageStatus: getUser ? "delivered" : "sent",
            type: "audio",
          },
        });

        return res.status(201).json({ message });
      }

      return res.status(400).send("from, to is required");
    }
    return res.status(400).send("Audio is required");
  } catch (error) {
    next(error);
  }
};

// getting all the sent and received messages of the logged in user
export const getInitialContactswithMessages = async (req, res, next) => {
  try {
    const userId = req.params.from;

    const prisma = getPrismaInstance();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          include: {
            receiver: true,
            sender: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },
        receivedMessages: {
          include: {
            receiver: true,
            sender: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const messages = [...user.sentMessages, ...user.receivedMessages];
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const users = new Map(); // userId : {}
    const messageStatusChange = [];

    messages.forEach((msg) => 
    {
      const isSender = msg.senderId === userId;
      const calculatedId = isSender ? msg.receiverId : msg.senderId;
      if (msg.messageStatus === "sent") {
        messageStatusChange.push(msg.id);
      }
      const {
        id,
        type,
        message,
        messageStatus,
        createdAt,
        senderId,
        receiverId,
      } = msg;

      if (!users.get(calculatedId)) {
       

        let user = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          receiverId,
        };

        // if the logged in user is the sender then add the receiver details and unread messages 0
        if (isSender) {
          user = {
            ...user,
            ...msg.receiver, // other user details
            totalUnreadMessages: 0,
          };
        }
        // if the logged in user is not the sender then add the sender and unread messages as 1 if the message is not read
        else {
          user = {
            ...user,
            ...msg.sender, // other user details
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }

        users.set(calculatedId, { ...user });
      } else if (messageStatus !== "read" && !isSender) {
        // mapping all the messages are received but not read by the logged in user
        const user = users.get(calculatedId);
        users.set(calculatedId, {
          ...user,
          totalUnreadMessages: user.totalUnreadMessages + 1, // update the unread messages count
        });

        /*
           {
              userid :{
                        messageId: id,
                        type,
                        message,
                        messageStatus,
                        createdAt,
                        senderId,
                        receiverId,
                      };
           }
        
        */
      }
    });

    if (messageStatusChange.length) {
      // update the unread message status in database
      await prisma.messages.updateMany({
        where: {
          id: { in: messageStatusChange },
        },
        data: {
          messageStatus: "delivered",
        },
      });
    }


    return res.status(200).json({
      users: Array.from(users.values()),
      onlineUsers : Array.from(onlineUsers.keys())
    })
  } catch (error) {
    next(error);
  }
};

