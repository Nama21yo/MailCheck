const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config(); // Load environment variables

const { PORT } = require("./config/serverConfig");
const connectDB = require("./config/database");

const setUpAndStartServer = async () => {
  const app = express();

  // Middlewares
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  try {
    await connectDB(); // Ensure DB connection before starting the server
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to DB. Server not started.");
    process.exit(1); // process stops if DB fails
  }
};

setUpAndStartServer();
