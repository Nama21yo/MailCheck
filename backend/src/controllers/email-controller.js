// controllers/email-controller.js

const EmailVerificationService = require("../services/email-verification");
const config = require("../config/serverConfig");

class EmailController {
  constructor() {
    this.verificationService = new EmailVerificationService(
      config.emailVerificationApiKey
    );
  }

  async verifyEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Log the API key (first few chars only for security)
      const apiKeyPreview = config.emailVerificationApiKey
        ? `${config.emailVerificationApiKey.substring(0, 4)}...`
        : "not set";
      console.log(`Using API key: ${apiKeyPreview}`);

      const result = await this.verificationService.verifyEmail(email);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Email verification error in controller:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to verify email",
        error: error.message,
      });
    }
  }
}

module.exports = EmailController;
