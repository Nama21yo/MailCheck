const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config(); // Load environment variables
const cors = require("cors"); // Import cors package

const { PORT } = require("./config/serverConfig");
const connectDB = require("./config/database");
const apiRoutes = require("./routes/auth-routes"); // Import the auth routes
const emailRoutes = require("./routes/email-routes"); // Import the email verification routes

const setUpAndStartServer = async () => {
  const app = express();

  // Enable CORS for all origins
  app.use(cors()); // No options passed, enabling CORS for all origins

  // Middlewares
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Routes
  app.use("/api", apiRoutes);
  app.use("/api/email", emailRoutes); // Register email verification routes

  try {
    await connectDB(); // Ensure DB connection before starting the server
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(
        `Email verification API endpoint: http://localhost:${PORT}/api/email/verify`
      );
    });
  } catch (error) {
    console.error("Failed to connect to DB. Server not started.");
    process.exit(1); // process stops if DB fails
  }
};

setUpAndStartServer();
