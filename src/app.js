// app.js
const express = require('express')

const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const cors = require("cors");
require('dotenv').config();
// Route files
const authRouter = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const updateRoutes = require('./routes/update');
const connectionRoutes = require('./routes/request');
const userRouter = require('./routes/user');

const app = express();
app.use(cors({
  origin: "http://localhost:5173", // Or whatever your frontend URL is
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/', authRouter);
app.use('/', profileRoutes);
app.use('/', updateRoutes);
app.use('/', connectionRoutes);
app.use('/', userRouter);

// Connect to database and start server
connectDB()
    .then(() => {
        console.log("Database connected successfully 🚀");
        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch(err => {
        console.error("Database connection failed ❌", err);
    });