const { verifyEmail } = require("@devmehq/email-validator-js");
const disposableDomains = require("disposable-email-domains");

class EmailVerificationService {
  /**
   * Verify an email address and return a detailed response with formatted output
   * @param {string} email - The email address to verify
   * @returns {Promise<Object>} - Full verification details + formatted result
   */
  async verifyEmail(email) {
    try {
      console.log(`Verifying email: ${email}`);

      // Perform email verification
      const result = await verifyEmail({
        emailAddress: email,
        verifyMx: true,
        verifySmtp: true,
        verifyCatchAll: true,
        timeout: 10000, // 10 seconds timeout
      });

      console.log(`Verification result for ${email}:`, result);

      // Extract key details
      const { validFormat, validMx, validSmtp, catchAllCheck } = result;

      // Check if the email is from a disposable provider
      const isDisposable = this.checkDisposable(email);

      // Calculate score based on different criteria
      const score = this.calculateScore(
        validFormat,
        validMx,
        validSmtp,
        isDisposable,
        catchAllCheck
      );

      // Determine email status
      const status = this.determineStatus(
        validFormat,
        validMx,
        validSmtp,
        score
      );

      // Construct response object
      const response = {
        email: email,
        status: status,
        details: {
          validFormat: validFormat,
          validMx: validMx,
          validSmtp: validSmtp,
          catchAllDomain: catchAllCheck,
          isDisposable: isDisposable,
          score: score,
        },
        formattedResult: `${status}\n${email}\n`,
      };

      return response;
    } catch (error) {
      console.error(`Error verifying ${email}:`, error.message);

      return {
        email: email,
        status: "Error",
        details: {
          error: error.message,
        },
        formattedResult: `Error\n${email}\n`,
      };
    }
  }

  /**
   * Check if an email domain is disposable
   * @param {string} email - The email address to check
   * @returns {boolean} - True if disposable, false otherwise
   */
  checkDisposable(email) {
    const domain = email.split("@")[1].toLowerCase();
    return disposableDomains.includes(domain);
  }

  /**
   * Calculate verification score
   * @param {boolean} validFormat
   * @param {boolean} validMx
   * @param {boolean|null} validSmtp
   * @param {boolean} isDisposable
   * @param {boolean|null} catchAllCheck
   * @returns {number} - Score between 0-100
   */
  calculateScore(validFormat, validMx, validSmtp, isDisposable, catchAllCheck) {
    let score = 0;
    if (validFormat) score += 30;
    if (validMx) score += 35;
    if (validSmtp === true) score += 35;
    if (isDisposable) score -= 50; // Deduct points for disposable emails
    if (catchAllCheck === true) score -= 20; // Deduct points for catch-all domains
    return Math.max(score, 0);
  }

  /**
   * Determine email status based on verification results
   * @param {boolean} validFormat
   * @param {boolean} validMx
   * @param {boolean|null} validSmtp
   * @param {number} score
   * @returns {string} - Status (Delivered, Undeliverable, Bounced, Risky)
   */
  determineStatus(validFormat, validMx, validSmtp, score) {
    if (!validFormat || !validMx) return "Undeliverable";
    if (validSmtp === false) return "Bounced";
    if (score >= 80) return "Delivered";
    if (score >= 50) return "Risky"; // New category for better classification
    return "Undeliverable";
  }
}

module.exports = EmailVerificationService;
