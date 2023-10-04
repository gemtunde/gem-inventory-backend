const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Token = require("../models/tokenModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

//token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, {
    expiresIn: "3d",
  });
};

const registerUser = async (req, res) => {
  try {
    //validation
    const { name, email, password } = req.body;

    if (!name || !email || !email) {
      res.status(400);
      throw new Error("Please fill all required fields");
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be greater than 6 characters");
    }

    //check if user exists
    const user = await User.findOne({ email });
    if (user) {
      res.status(400);
      throw new Error("user already exist");
    }

    //hash password method 1
    //check model for method 2
    // const salt = await bcrypt.genSalt(10);
    // const hashPassword = await bcrypt.hash(password, salt);

    //create new user
    const newUser = await User.create({
      name,
      email,
      password,
    });

    //token
    const token = generateToken(newUser._id);

    //send HTTP-only cookie
    //cookie is better than local storage bcoz it sucures againt cross-browser attackes
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //1day
      sameSite: "none",
      secure: true,
    });

    if (newUser) {
      const { _id, name, email, photo, phone, bio } = newUser;

      res.status(201).json({
        message: "User created successful",
        _id,
        name,
        email,
        photo,
        phone,
        bio,
        token,
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
};

//login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    //validate
    if (!email || !password) {
      res.status(400);
      throw new Error(" email or password required");
    }
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400);
      throw new Error("User not found, please signup");
    }

    //compare passsword
    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      throw new Error("Wrong Password");
    }

    //token
    const token = generateToken(user._id);

    //send HTTP-only cookie
    //cookie is better than local storage bcoz it sucures againt cross-browser attackes
    if (comparePassword) {
      res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //1day
        sameSite: "none",
        secure: true,
      });
    }
    //response
    if (user && comparePassword) {
      const { _id, name, email, photo, phone, bio } = user;

      res.status(200).json({
        message: "Login successful",
        _id,
        name,
        email,
        photo,
        phone,
        bio,
        token,
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
};

//logout user
const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(Date(0)),
      sameSite: "none",
      secure: true,
    });
    return res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
};

//get user by id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      const { _id, name, email, photo, phone, bio } = user;

      res.status(200).json({
        message: "Login successful",
        _id,
        name,
        email,
        photo,
        phone,
        bio,
      });
    } else {
      res.status(401);
      throw new Error("User not found");
    }
  } catch (error) {
    res.json({
      error: error.message,
      status: false,
    });
  }
};

//login status
const loginStatus = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  const verified = jwt.verify(token, process.env.TOKEN_SECRET);
  if (verified) {
    return res.json(true);
  } else {
    return res.json(false);
  }
};

//update user
const updateUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.photo = req.body.photo || photo;
    user.bio = req.body.bio || bio;

    const updateUser = await user.save();

    res.status(200).json({
      message: "Login successful",
      name: updateUser.name,
      email: updateUser.email,
      photo: updateUser.photo,
      phone: updateUser.phone,
      bio: updateUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};

//change pasword
const changePassword = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, newPassword } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }
  //validate
  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Please add old or new password");
  }
  //compare oldpassword matches with password in db
  const comparePassword = await bcrypt.compare(oldPassword, user.password);
  if (!comparePassword) {
    res.status(400);
    throw new Error("Old Password is wrong");
  }
  if (user) {
    user.password = newPassword;

    await user.save();
    res.status(200).send("Password updated");
  } else {
    res.status(400);

    throw new Error("Old Password is incorrect");
  }
};

//forgot password

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  //validate user
  if (!user) {
    res.status(400);
    throw new Error("User does not exist");
  }

  //delete previous tokens by user
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // create reset token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log("resettoken", resetToken);

  //hash token
  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  //console.log("hashedtoken", hashedToken);
  //res.send("forgot password");

  //save token to db
  await Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //thirty minutes,
  }).save();

  //construct reset url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  //reset email
  const message = `
<h2>Hello ${user.name}</h2>
<p> Please use the url below to reset your password</p>
<p> This reset link expires in 30 minutes</p>

<a href=${resetUrl} clicktracking=off > ${resetUrl} </a>

<p>Regards</p>
`;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);

    res.status(200).json({
      success: true,
      message: "Reset Link sent to " + email,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Password reset email not sent");
  }
};

const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  //hash resettoken and then compare to token in db
  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //find tokenn in db
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });
  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or expired token");
  }
  //find User and update password
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Reset successful. Please login ",
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
