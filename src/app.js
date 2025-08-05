// app.js
const express = require('express')
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const cors = require("cors");
require('dotenv').config();
require('./utils/cronjobs')
// Route files
const authRouter = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const updateRoutes = require('./routes/update');
const connectionRoutes = require('./routes/request');
const userRouter = require('./routes/user');
const paymentRouter=require('./routes/payment')
const http= require('http');
const initializeSocket = require('./utils/socket');
const chatRouter = require('./routes/chat');

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
app.use('/',paymentRouter)
app.use('/',chatRouter)

const server=http.createServer(app)
initializeSocket(server)

// Connect to database and start server
connectDB()
    .then(() => {
        console.log("Database connected successfully 🚀");
        server.listen(process.env.PORT, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch(err => {
        console.error("Database connection failed ❌", err);
    });