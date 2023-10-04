const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

const ContactController = async (req, res) => {
  try {
    const { subject, message } = req.body;

    //validation
    if (!subject || !message) {
      res.status(400);
      throw new Error("Please fill all fields");
    }
    //check user in db
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(400);
      throw new Error("User not found");
    }

    //sendmail
    const send_to = process.env.EMAIL_USER;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = user.email;
    await sendEmail(subject, message, send_to, sent_from, reply_to);

    res.status(200).json({
      success: true,
      message: "Email Sent",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Password reset email not sent");
  }
};

module.exports = {
  ContactController,
};
