const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://gem-inventory.vercel.app"],
    credentials: true,
  })
);

//image upload
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//db connection
const dbConfig = require("./config/dbConfig");

//Routes
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const contactRoute = require("./routes/contactRoute");

//user
app.use("/api/users/", userRoute);

//product
app.use("/api/products/", productRoute);

//contact-us
app.use("/api/contacts/", contactRoute);

app.get("/", (req, res) => {
  res.send({ message: "home details" });
});

//error handler
app.use(errorHandler);

//port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
