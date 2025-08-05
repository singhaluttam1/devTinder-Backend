const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // Added for better query performance
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    // For future media support
    attachments: [{
      url: String,
      type: {
        type: String,
        enum: ['image', 'video', 'document']
      }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for frequently queried fields
messageSchema.index({ createdAt: -1 }); // Sort by newest first
messageSchema.index({ senderId: 1, createdAt: -1 });

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2; // Ensure exactly 2 participants for 1:1 chat
      },
      message: props => `Chat must have exactly 2 participants, got ${props.value.length}`
    }
  }],
  messages: [messageSchema],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  // For group chat future-proofing
  isGroup: {
    type: Boolean,
    default: false
  },
  groupInfo: {
    name: String,
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to update lastMessage when new messages are added
chatSchema.pre('save', function(next) {
  if (this.isModified('messages') && this.messages.length > 0) {
    this.lastMessage = this.messages[this.messages.length - 1]._id;
  }
  next();
});

// Static method for finding or creating chats
chatSchema.statics.findOrCreate = async function(userId1, userId2) {
  const chat = await this.findOne({
    participants: { $all: [userId1, userId2] }
  }).populate({
    path: 'messages.senderId',
    select: 'firstName lastName avatar'
  });

  if (chat) return chat;

  return this.create({
    participants: [userId1, userId2],
    messages: []
  });
};

// Virtual for unread count (example implementation)
chatSchema.virtual('unreadCount', {
  ref: 'Message',
  localField: 'messages',
  foreignField: '_id',
  count: true
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = { Chat };