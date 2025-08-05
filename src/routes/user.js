const express = require('express')
const { userAuth } = require('../middlewares/auth')
const ConnectionRequest = require("../models/connectionRequest")
const User = require('../models/user')
const { default: pagination } = require('../utils/pagination')
const userRouter = express.Router()
pagination

// get all the pending connection request for the  loggedIn User
const USER_SAFE_DATA = "firstName lastName photourl age gender about skills"
userRouter.get("/user/requests", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user
        const connectionRequest = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested"
        }).populate("fromUserId", USER_SAFE_DATA)
        res.json({ message: "Data fetched Successfully", data: connectionRequest })

    } catch (err) {
        res.status(400).send("Error:" + err.message)
    }
})

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user
        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUser._id, status: "accepted" },
                { fromUserId: loggedInUser._id, status: "accepted" }
            ]
        }).populate("fromUserId", USER_SAFE_DATA)
            .populate("toUserId", USER_SAFE_DATA);

        const data = connectionRequest.map((row) => {
            if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
                return row.toUserId
            }
            return row.fromUserId
        }
        )
        res.json({ data })
    } catch (error) {
        res.status(400).send("Error:" + err.message)
    }
})
userRouter.get('/feedcards', userAuth, async (req, res) => {
    try {
        //User should see all the users cards except    
        // 0. his own card
        // 1. ignored the profiles
        // 2. his connections
        // 3. already sent the connection request

        // Example Rahul = [aradhya, uttam, akshay]
        // Rahul--> aryan--> accepted
        // Rahul--> ayush--> Rejected   
        // Ayush  = [aryan, aradhya, uttam ,akshay]  Except rahul    
        const loggedInUser = req.user

        const page = parseInt(req.query.page) || 1
        let limit = parseInt(req.query.limit) || 10
        limit = limit > 50 ? 50 : limit
        const skip = (page - 1) * limit

        //Find all connection request sent or received
        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        }).select("fromUserId toUserId")


        const hideUsersfromFeed = new Set()
        connectionRequest.forEach(req => {
            hideUsersfromFeed.add(req.fromUserId.toString());
            hideUsersfromFeed.add(req.toUserId.toString());
        })
        const users = await User.find({
            $and: [
                { _id: { $nin: Array.from(hideUsersfromFeed) } },

                { _id: { $ne: loggedInUser._id } }
            ]
        }).select(USER_SAFE_DATA)
            .skip(skip)
            .limit(limit)
        res.send(users)


    } catch (err) {
        res.status(400).send("Error:" + err.message)

    }
})
// routes/user.js
userRouter.get('/status/:userId', (req, res) => {
  const isOnline = onlineUsers.has(req.params.userId);
  res.json({ isOnline });
});

module.exports = userRouter