const express = require("express");
const mongoose = require("mongoose");
const { Chat } = require("../models/chat");
const { userAuth } = require("../middlewares/auth");

const chatRouter = express.Router();

chatRouter.get('/chat/:targetUserId', userAuth, async (req, res) => {

  const { targetUserId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID(s)" });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] }
    })
    .populate("messages.senderId", "firstName lastName");

    if (!chat) {
      chat = await new Chat({
        participants: [userId, targetUserId],
        messages: []
      }).save();
    }

    res.json({
  messages: chat.messages, // Instead of the whole chat objectxxwxw
  participants: chat.participants
});
  } catch (error) {
    console.error("Chat fetch error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = chatRouter;