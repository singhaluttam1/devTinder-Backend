const express = require('express')
const requestRouter = express.Router()
const ConnectionRequest = require('../models/connectionRequest')
const { userAuth } = require('../middlewares/auth');
const User = require('../models/user');

// Connection request
requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id
        const toUserId = req.params.toUserId
        const status = req.params.status

        const allowedStatus = ["ignored", "interested"]
        if (!allowedStatus.includes(status)) {
            
            return res.status(400).json({ message: "Invalid status type: " + status })
        }
    
        const toUser = await User.findById(toUserId)
        if(!toUser){
            return res.status(404).json({message:"User Not Found"})
        }
        //Check if there Existing connection request
        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                {fromUserId,toUserId,},
                {fromUserId:toUserId,toUserId:fromUserId,}
            ]
        })
        if(existingConnectionRequest){
            return res.status(400).json({message:"Connection request already Exists"})
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId, toUserId, status
        })
        const data = await connectionRequest.save()
        const fromUser=await User.findById(fromUserId)
        res.json({
            message: `${fromUser.firstName} is Interested in ${toUser.firstName}  `,
            data
        })
    } catch (err) {
        res.status(500).json({ message: "Error: " + err.message });
    }
});
const mongoose = require("mongoose");

requestRouter.post("/request/review/:status/:fromUserId", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user; // this is toUserId
        const fromUserId = req.params.fromUserId;
        const status = req.params.status.toLowerCase();

        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Status not allowed" });
        }

        // Ensure both IDs are ObjectId type
        const connectionRequest = await ConnectionRequest.findOne({
            fromUserId,
            toUserId: loggedInUser._id,
            status: "interested"
          }).populate("fromUserId", "firstName");

        if (!connectionRequest) {
            return res.status(404).json({ message: "Connection request not found or already reviewed" });
        }

        connectionRequest.status = status;
        connectionRequest.updatedAt = new Date();
        const data = await connectionRequest.save();

        res.json({
            message: `Connection request ${status} from ${connectionRequest.fromUserId.firstName}`,
            data
        });
    } catch (err) {
        res.status(500).json({ message: "Error: " + err.message });
    }
});

module.exports = requestRouter