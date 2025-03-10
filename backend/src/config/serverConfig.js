const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
dotenv.config(); // Load environment variables from .env

module.exports = {
  PORT: process.env.PORT || 7000, // Default to 5000 if PORT is not set
  MONGO_URI: process.env.MONGO_URI,
  SALT: bcrypt.genSaltSync(9),
  emailVerificationApiKey: process.env.WHOISXML_API_KEY,
};
