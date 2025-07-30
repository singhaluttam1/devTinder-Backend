const express = require('express');
const User = require('../models/user'); // ✅ Adjust path based on your folder structure
const { userAuth } = require('../middlewares/auth'); // ✅ Adjust path based on your folder structure
const { validateEditProfileData } = require('../utils/validation');
const profile= express.Router()
const bcrypt = require('bcrypt');
const validator=require('validator');
const pagination = require('../utils/pagination');
// Profile route
profile.get("/profile/view", userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.send(user);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

profile.patch("/profile/edit",userAuth,async(req,res)=>{
    try {
        if(!validateEditProfileData(req)){
            throw new Error("Invalid Edit Request")
        }
        const loggedInUser=req.user

        Object.keys(req.body).forEach(key=>loggedInUser[key]=req.body[key])
        loggedInUser.save()
        res.json({message:`${loggedInUser.firstName}`+"updated " ,data:loggedInUser})
        
    } catch (err) {
        res.status(404).send("Error:"+ err.message)
    }
})
profile.patch("/profile/passwordUpdate",userAuth,async(req,res)=>{
    try {
        const {newPassword}=req.body
        if (!newPassword) {
            throw new Error("New password is required");
        }
        if(!validator.isStrongPassword(newPassword)){
            throw new Error("Please Enter Strong Passwrod (min 8 chars, 1 uppercase, 1 number, 1 symbol)")
        }
        const hashedPassword= await bcrypt.hash(newPassword,10)
            const user=req.user
            user.password=hashedPassword
            await user.save()
            res.json({message:`${user.firstName}`+"Password updated " ,data:user})
        
    } catch (err) {
         res.status(404).send("Error:"+ err.message)
    }
})

// Get user by email
profile.get("/user", userAuth, async (req, res) => {
    const userEmail = req.body.emailID;
    try {
        const user = await User.findOne({ emailID: userEmail });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.status(200).send(user);
    } catch (err) {
        res.status(404).send("Something went wrong: " + err.message);
    }
});
// Get user by ID
profile.get("/userID", async (req, res) => {
    const userId = req.query.id;
    if (!userId) {
        return res.status(400).send("User ID is required in query");
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send(user);
    } catch (err) {
        res.status(404).send("Something went wrong: " + err.message);
    }
});

// Delete user
profile.delete("/delete", async (req, res) => {
    const userId = req.body.userId;
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send("User deleted successfully");
    } catch (err) {
        res.status(404).send("Something went wrong: " + err.message);
    }
});
module.exports=profile