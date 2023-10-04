const mongoose = require("mongoose");

mongoose.connect(process.env.mongoDB_url);

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log("Mongo DB connection successful");
});
connection.on("error", (err) => {
  console.log("Mongo DB Failed");
});

module.exports = connection;
