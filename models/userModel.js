const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [6, "Password length must be upto 6 characters"],
      // maxLength: [23, "Password length must be less than 23 characters"],
    },
    photo: {
      type: String,
      required: [true, "Picture is required"],
      default: "https://i.ibb.co/4pDNDk1/avatar.png",
    },
    phone: {
      type: String,
      default: "+234",
    },
    bio: {
      type: String,
      // minLength: [6, "Bio length must be upto 6 characters"],
      // maxLength: [230, "Bio length must be less than 230 characters"],
      default: "Bio",
    },
  },
  {
    timestamps: true,
  }
);

//hash password method 2
userSchema.pre("save", async function (next) {
  //if the password field is not change, perform the next action in the controller
  //don't touch the password
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(this.password, salt);
  this.password = hashPassword;

  next();
});

const User = mongoose.model("users", userSchema);
module.exports = User;
