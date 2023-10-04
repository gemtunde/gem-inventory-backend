const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { ContactController } = require("../controllers/contactController");

router.post("/", protect, ContactController);

module.exports = router;
