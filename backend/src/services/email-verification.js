const { verifyEmail } = require("@devmehq/email-validator-js");
const disposableDomains = require("disposable-email-domains");
const isEmail = require("validator/lib/isEmail");
const dns = require("dns");
const { promisify } = require("util");

// Promisify DNS lookups
const resolveMx = promisify(dns.resolveMx);

class EnhancedEmailVerificationService {
  /**
   * Verify an email address with comprehensive checks
   * @param {string} email - The email address to verify
   * @returns {Promise<Object>} - Detailed verification results
   */
  async verifyEmail(email) {
    try {
      console.log(`Verifying email: ${email}`);

      // Basic format validation
      const validFormat = isEmail(email);
      if (!validFormat) {
        return this.createResponse(email, "Undeliverable", {
          validFormat: false,
          reason: "INVALID_FORMAT",
          score: 0,
        });
      }

      // Extract domain
      const domain = email.split("@")[1].toLowerCase();

      // Check disposable email
      const isDisposable = this.checkDisposable(domain);

      // Check free email
      const isFreeEmail = this.checkFreeEmail(domain);

      // Check role account
      const isRoleAccount = this.checkRoleAccount(email);

      // Perform core email verification
      const result = await verifyEmail({
        emailAddress: email,
        verifyMx: true,
        verifySmtp: true,
        verifyCatchAll: true,
        timeout: 15000, // 15 seconds timeout
      });

      console.log(`Core verification result for ${email}:`, result);

      // Extract key details
      const { validMx, validSmtp, catchAllCheck } = result;

      // Perform additional DNS checks
      const dnsInfo = await this.performDnsChecks(domain);

      // Calculate score
      const score = this.calculateScore(
        validFormat,
        validMx,
        validSmtp,
        isDisposable,
        isFreeEmail,
        isRoleAccount,
        catchAllCheck,
        dnsInfo.hasMxRecords,
        domain
      );

      // Determine status and reason
      const { status, reason } = this.determineStatus(
        validFormat,
        validMx,
        validSmtp,
        score,
        catchAllCheck,
        isDisposable,
        domain
      );

      // Create canonical address suggestion if needed
      const suggestion = this.getSuggestion(email, domain);

      // Construct detailed response
      return this.createResponse(email, status, {
        validFormat,
        validMx,
        validSmtp,
        reason,
        domain,
        isFree: isFreeEmail,
        isRole: isRoleAccount,
        isDisposable,
        isAcceptAll: catchAllCheck,
        hasTag: email.includes("+"),
        mxRecords: dnsInfo.mxRecords,
        score,
        suggestion,
        canonicalAddress: email.split("@")[0],
        smtpDetails: result.smtpDetails || {},
      });
    } catch (error) {
      console.error(`Error verifying ${email}:`, error.message);

      return this.createResponse(email, "Error", {
        error: error.message,
        reason: "VERIFICATION_ERROR",
        score: 0,
      });
    }
  }

  /**
   * Create a standardized response object
   */
  createResponse(email, status, details) {
    const formattedResult = this.formatResult(email, status, details);

    return {
      email,
      status,
      details,
      formattedResult,
    };
  }

  /**
   * Format the verification result for display
   */
  formatResult(email, status, details) {
    const lines = [
      `Score: ${details.score}`,
      `* State: ${status}`,
      `* Reason: ${details.reason || "N/A"}`,
      `* Domain: ${details.domain || "N/A"}`,
      `* Free: ${details.isFree}`,
      `* Role: ${details.isRole}`,
      `* Disposable: ${details.isDisposable}`,
      `* Accept-All: ${details.isAcceptAll}`,
      `* Tag: ${details.hasTag}`,
    ];

    // Add MX Record info
    if (details.mxRecords) {
      lines.push(`* MX Record: ${details.mxRecords.length > 0 ? "Yes" : "No"}`);
    }

    // Add any limitations or issues
    const limitations = this.getLimitations(details);
    if (limitations.length > 0) {
      lines.push(`* Limited: ${limitations.join(". ")}`);
    }

    // Add canonical address
    lines.push(`* **Canonical address**\n${details.canonicalAddress || "N/A"}`);

    // Add role address check
    lines.push(
      `**Role address check**\n**${
        details.isRole ? "Role account detected" : "Ok"
      }**`
    );

    // Add mailbox exists check
    lines.push(
      `**Mailbox exists check**\n**${details.validMx ? "Ok" : "Failed"}**`
    );

    // Add SMTP check
    lines.push(`**SMTP check**\n**${details.validSmtp ? "Ok" : "Failed"}**`);

    // Add suggestion if available
    lines.push(`**Did you mean**\n${details.suggestion || "N/A"}`);

    // Add domain info
    lines.push(`**Domain Info**`);
    lines.push(`**MX Record check**\n**${details.validMx ? "Ok" : "Failed"}**`);

    // Add disposable check
    lines.push(
      `**Disposable email check**\n**${
        details.isDisposable ? "Disposable domain detected" : "Ok"
      }**`
    );

    // Add accept-all check
    lines.push(
      `**Accept-all address check**\n**${
        details.isAcceptAll ? "Accept-all domain detected" : "Ok"
      }**`
    );

    // Add greylisting check - This would require more complex SMTP testing
    lines.push(
      `**Greylisting check**\n**${
        details.smtpDetails?.greylisted ? "Greylisted" : "Ok"
      }**`
    );

    return lines.join("\n");
  }

  /**
   * Get a list of limitations or issues with the email
   */
  getLimitations(details) {
    const limitations = [];

    if (details.smtpDetails?.quotaExceeded) {
      limitations.push("Recipient mailbox is over quota or rate limit");
    }

    if (!details.validMx) {
      limitations.push(
        "No MX or MX Error: No Mail Server or Mail Server Error"
      );
    }

    // Don't add catch-all limitation for trusted domains
    if (details.isAcceptAll && !this.isTrustedDomain(details.domain)) {
      limitations.push("Catch-All: Recipient email can not be verified");
    }

    if (details.smtpDetails?.timeout) {
      limitations.push("Timeout: Mail Server does not respond");
    }

    if (details.smtpDetails?.spamBlocked) {
      limitations.push("SPAM Block: Mail Server has a strong SPAM protection");
    }

    return limitations;
  }

  /**
   * Check if domain is in the disposable domains list
   */
  checkDisposable(domain) {
    return disposableDomains.includes(domain);
  }

  /**
   * Check if domain is a free email provider
   */
  checkFreeEmail(domain) {
    const freeEmailDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "protonmail.com",
      "mail.com",
      "zoho.com",
      "yandex.com",
      "gmx.com",
      "gmx.net",
      "tutanota.com",
      "inbox.com",
      "mail.ru",
    ];

    return freeEmailDomains.includes(domain);
  }

  /**
   * Check if the domain is a trusted email provider
   * Trusted providers might have catch-all behavior but are still reliable
   */
  isTrustedDomain(domain) {
    const trustedDomains = [
      "gmail.com",
      "googlemail.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "protonmail.com",
      "yahoo.com",
      "microsoft.com",
      "apple.com",
      "amazon.com",
      "aol.com",
    ];

    return trustedDomains.includes(domain.toLowerCase());
  }

  /**
   * Check if email is a role account
   */
  checkRoleAccount(email) {
    const roleAddresses = [
      "admin",
      "administrator",
      "hostmaster",
      "info",
      "postmaster",
      "webmaster",
      "support",
      "noreply",
      "no-reply",
      "sales",
      "contact",
      "help",
      "mail",
      "office",
      "jobs",
      "team",
      "customerservice",
      "billing",
      "marketing",
      "hr",
    ];

    const localPart = email.split("@")[0].toLowerCase();
    return roleAddresses.some(
      (role) => localPart === role || localPart.startsWith(role + ".")
    );
  }

  /**
   * Perform additional DNS checks
   */
  async performDnsChecks(domain) {
    try {
      const mxRecords = await resolveMx(domain);
      return {
        hasMxRecords: mxRecords.length > 0,
        mxRecords,
      };
    } catch (error) {
      return {
        hasMxRecords: false,
        mxRecords: [],
        error: error.message,
      };
    }
  }

  /**
   * Generate email suggestion for common typos
   */
  getSuggestion(email, domain) {
    const commonDomains = {
      "gmial.com": "gmail.com",
      "gamil.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gmail.co": "gmail.com",
      "hotmial.com": "hotmail.com",
      "homail.com": "hotmail.com",
      "hotmail.co": "hotmail.com",
      yahoocom: "yahoo.com",
      "yaho.com": "yahoo.com",
      "outloo.com": "outlook.com",
      "outlok.com": "outlook.com",
    };

    if (commonDomains[domain]) {
      const localPart = email.split("@")[0];
      return `${localPart}@${commonDomains[domain]}`;
    }

    return null;
  }

  /**
   * Calculate verification score
   */
  calculateScore(
    validFormat,
    validMx,
    validSmtp,
    isDisposable,
    isFreeEmail,
    isRoleAccount,
    catchAllCheck,
    hasMxRecords,
    domain
  ) {
    let score = 0;

    // Base criteria
    if (validFormat) score += 20;
    if (validMx) score += 20;
    if (hasMxRecords) score += 10;
    if (validSmtp === true) score += 30;

    // Deductions
    if (isDisposable) score -= 40; // Major deduction for disposable emails

    // Only apply catchAll penalty if not a trusted domain
    if (catchAllCheck === true && !this.isTrustedDomain(domain)) {
      score -= 20; // Deduction for catch-all domains
    }

    if (isFreeEmail && !this.isTrustedDomain(domain)) {
      score -= 5; // Minor deduction for free email services (except trusted ones)
    }

    if (isRoleAccount) score -= 10; // Deduction for role accounts

    // Boost score for trusted domains
    if (this.isTrustedDomain(domain)) {
      score += 10; // Bonus for trusted domains
    }

    // Ensure score is within bounds
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Determine email status based on verification results
   */
  determineStatus(
    validFormat,
    validMx,
    validSmtp,
    score,
    catchAllCheck,
    isDisposable,
    domain
  ) {
    // Determine status
    let status, reason;

    // Special handling for Gmail and other trusted providers
    const isTrusted = this.isTrustedDomain(domain);

    if (!validFormat) {
      status = "Undeliverable";
      reason = "INVALID_FORMAT";
    } else if (!validMx) {
      status = "Undeliverable";
      reason = "INVALID_DOMAIN";
    } else if (validSmtp === false) {
      // If SMTP check fails, it's definitely undeliverable
      status = "Bounced";
      reason = "MAILBOX_NOT_FOUND";
    } else if (isDisposable) {
      status = "Risky";
      reason = "DISPOSABLE_EMAIL";
    } else if (catchAllCheck === true && !isTrusted) {
      // Only mark as risky if it's a catch-all domain AND not a trusted provider
      status = "Risky";
      reason = "CATCH_ALL_DOMAIN";
    } else if (validSmtp === true && isTrusted) {
      // For trusted domains that pass SMTP check, always mark as Deliverable
      status = "Deliverable";
      reason = "ACCEPTED_EMAIL";
    } else if (score >= 80) {
      status = "Deliverable";
      reason = "ACCEPTED_EMAIL";
    } else if (score >= 50) {
      status = "Risky";
      reason = "UNCERTAIN_DELIVERABILITY";
    } else {
      status = "Undeliverable";
      reason = "LOW_QUALITY_SCORE";
    }

    return { status, reason };
  }
}

module.exports = EnhancedEmailVerificationService;
