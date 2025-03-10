// routes/email-routes.js

const express = require("express");
const EmailController = require("../controllers/email-controller");
const config = require("../config/serverConfig");

const router = express.Router();
const emailController = new EmailController(config.emailVerificationApiKey);

// POST /api/email/verify
router.post("/verify", (req, res) => emailController.verifyEmail(req, res));

module.exports = router;
