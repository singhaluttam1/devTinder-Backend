const express = require('express');
const update = express.Router();
const User = require('../models/user');

// Update user
update.patch("/update/:id", async (req, res) => {
    const userId = req.params.id;
    const data = req.body;
    try {
        const ALLOWED_UPDATES = ["photourl", "about", "gender", "age", "skills", "password"];
        const isUpdateAllowed = Object.keys(data).every(k => ALLOWED_UPDATES.includes(k));
        if (!isUpdateAllowed) {
            throw new Error("Update not allowed");
        }

        if (data?.skills?.length > 10) {
            throw new Error("Skills cannot be more than 10");
        }

        const user = await User.findByIdAndUpdate(userId, data, {
            new: true,
            runValidators: true,
        });

        res.send("User updated successfully");
    } catch (err) {
        res.status(404).send(err.message);
    }
});
module.exports=update