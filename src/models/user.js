// models/user.js
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET_KEY;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 50,
    },
    lastName: {
      type: String,
      default:""

    },
    emailID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email Address: " + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Password must be strong (include uppercase, lowercase, number, and symbol)");
        }
      },
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      enum:{
        values:["male","female","others"],
        message:`{VALUE} ias not valid gender type`
      },
      // validate(value) {
      //   if (!["male", "female", "others"].includes(value)) {
      //     throw new Error("Gender data is not valid");
      //   }
      // },
    },
    photourl: {
      type: String,
      default: "https://cielhr.com/wp-content/uploads/2020/10/dummy-image.jpg",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid URL");
        }
      },
    },
    about: {
      type: String,
      default: "This is the random description of about of the user",
    },
    skills: {
      type: [String],
      default:[]
    },
  },
  { timestamps: true }
);

userSchema.methods.getJWT = async function () {
  const token = jwt.sign({ _id: this._id }, jwtSecret, { expiresIn: "1d" });
  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  return await bcrypt.compare(passwordInputByUser, this.password);
};

module.exports = mongoose.model("User", userSchema);
