const mongoose = require("mongoose");
const { MONGO_URI } = require("./serverConfig");
const connect = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // Exit the process on failure
  }
};

module.exports = connect;
