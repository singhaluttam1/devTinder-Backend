const express=require('express')
const authRouter = express.Router();
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('../models/user'); // ✅ Adjust path based on your structure
const { validateSignUpData } = require('../utils/validation'); // ✅ Custom function
const saltRounds = 10;


// Sign Up
authRouter.post("/signup", async (req, res) => {
    try {
        validateSignUpData(req);
        const { firstName, lastName, emailID, password } = req.body;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            firstName,
            lastName,
            emailID,
            password: passwordHash,
        });

        res.send("User Added successfully");
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).send("Email already exists");
        }
        res.status(400).send("Error: " + err.message);
    }
});

// Login
authRouter.post("/login", async (req, res) => {
    try {
        const { emailID, password } = req.body;
        if (!validator.isEmail(emailID)) {
            throw new Error("Please enter a valid email");
        }

        const user = await User.findOne({ emailID });
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        const token = await user.getJWT();
        res.cookie("token", token, { httpOnly: true, expires: new Date(Date.now() + 8 * 3600000) });
        res.send("Login Successful");
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});
// Logout
authRouter.post("/logout", (req, res) => {
    res.cookie("token",null,{
        expires:new Date(Date.now())
    })
    res.send("Logged out successfully");
});

module.exports=authRouter