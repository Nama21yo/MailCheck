const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env

module.exports = {
  PORT: process.env.PORT || 5000, // Default to 5000 if PORT is not set
  MONGO_URI: process.env.MONGO_URI, // No default for MONGO_URI (must be set)
};
