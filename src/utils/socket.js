const socketIO = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
// Track online users with additional metadata
const onlineUsers = new Map(); // { userId: { socketId, lastActive } }

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("$"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingInterval: 10000, // Keep-alive
    pingTimeout: 5000
  });

  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    // ======================
    // 1. ONLINE STATUS SYSTEM
    // ======================
    socket.on('userOnline', (userId) => {
      if (!userId) return;
      
      onlineUsers.set(userId, { 
        socketId: socket.id,
        lastActive: new Date() 
      });
      
      // Notify all clients EXCEPT the sender
      socket.broadcast.emit('statusUpdate', { 
        userId, 
        isOnline: true,
        lastSeen: null 
      });
    });

    // =================
    // 2. CHAT FEATURES
    // =================
    socket.on("joinChat", async ({ userId, targetUserId }) => {
      if (!userId || !targetUserId) return;

      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
      
      // Send historical messages
      try {
        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] }
        }).populate('messages.senderId', 'firstName lastName');
        
        if (chat) {
          socket.emit('chatHistory', chat.messages);
        }
      } catch (err) {
        console.error("Chat history error:", err);
      }
    });

    socket.on("sendMessage", async (messageData) => {
  const { userId, targetUserId, text } = messageData;

  try {
    const isFriends = await ConnectionRequest.exists({
      $or: [
        { fromUserId: userId, toUserId: targetUserId, status: "accepted" },
        { fromUserId: targetUserId, toUserId: userId, status: "accepted" }
      ]
    });

    if (!isFriends) {
      return socket.emit('error', {
        code: 'FORBIDDEN',
        message: "You can only message friends"
      });
    }

    const chat = await Chat.findOneAndUpdate(
      { participants: { $all: [userId, targetUserId] } },
      {
        $push: {
          messages: {
            senderId: userId,
            text,
            createdAt: new Date()
          }
        }
      },
      { new: true, upsert: true }
    );

    const newMessage = chat.messages[chat.messages.length - 1];

    const sender = await User.findById(userId).select("firstName lastName");

    const roomId = getSecretRoomId(userId, targetUserId);

    io.to(roomId).emit("messageReceived", {
      _id: newMessage._id,
      text: newMessage.text,
      createdAt: newMessage.createdAt,
      senderId: {
        _id: userId,
        firstName: sender.firstName,
        lastName: sender.lastName
      }
    });

  } catch (err) {
    console.error("Message send error:", err);
    socket.emit("error", {
      code: "SERVER_ERROR",
      message: "Failed to send message"
    });
  }
});

    // =====================
    // 3. CONNECTION CLEANUP
    // =====================
    socket.on('disconnect', () => {
      // Find and remove disconnected user
      for (let [userId, data] of onlineUsers) {
        if (data.socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('statusUpdate', { 
            userId, 
            isOnline: false,
            lastSeen: new Date() 
          });
          break;
        }
      }
    });

    // ===================
    // 4. HEALTH CHECK
    // ===================
    socket.on('ping', (cb) => cb('pong'));
  });

  // ========================
  // 5. STATUS QUERY ENDPOINT
  // ========================
// In your socket.js file
const onlineUsers = new Map(); // { userId: { socketId, lastActive } }

// Add this to your existing socket initialization
io.getOnlineStatus = async (userId) => {
  if (onlineUsers.has(userId)) {
    return { 
      isOnline: true,
      lastActive: onlineUsers.get(userId).lastActive 
    };
  } else {
    // Fallback to database if user not in memory
    try {
      const user = await User.findById(userId).select('lastSeen');
      return {
        isOnline: false,
        lastSeen: user?.lastSeen || null
      };
    } catch (err) {
      console.error("Status check error:", err);
      return { 
        isOnline: false,
        lastSeen: null 
      };
    }
  }
};

  return io;
};

module.exports = initializeSocket;