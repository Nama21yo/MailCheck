import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info as InfoIcon,
  Mail,
  ArrowRight,
} from "lucide-react";

const EmailVerification = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous results and errors
    setResult(null);
    setError(null);

    // Validate email format client-side first
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email format");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:7000/api/email/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        // Handle API-level errors
        throw new Error(data.message || "Verification failed");
      }

      setResult(data);

      // Show notification based on verification result
      if (data.data.status === "Deliverable") {
        setNotificationMessage("Email verified successfully!");
      } else if (data.data.status === "Risky") {
        setNotificationMessage("Email appears risky. Proceed with caution.");
      } else {
        setNotificationMessage(
          `Email verification issue: ${data.data.details.reason}`
        );
      }
      setShowNotification(true);
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify email");
      setNotificationMessage(err.message || "Failed to verify email");
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Deliverable":
        return "bg-green-500";
      case "Undeliverable":
      case "Bounced":
        return "bg-red-500";
      case "Risky":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Deliverable":
        return <CheckCircle2 className="h-5 w-5" />;
      case "Undeliverable":
      case "Bounced":
        return <XCircle className="h-5 w-5" />;
      case "Risky":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getIndicatorColor = (value, invert = false) => {
    if (value === null || value === undefined) return "bg-gray-300";
    return value !== invert ? "bg-green-500" : "bg-red-500";
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Mail className="h-6 w-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Email Verification
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="email"
                  className={`flex-grow px-4 py-2 border rounded-l-lg focus:ring-2 focus:outline-none ${
                    emailError
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter email to verify"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-2"></div>
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                </button>
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>
          </form>

          {loading && (
            <div className="flex justify-center items-center my-8">
              <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Verifying email...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {result && result.success && !loading && (
            <div className="mt-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Verification Results
                  </h2>
                  <div
                    className={`px-3 py-1 rounded-full flex items-center text-white ${getStatusColor(
                      result.data.status
                    )}`}
                  >
                    {getStatusIcon(result.data.status)}
                    <span className="ml-1 font-medium">
                      {result.data.status}
                    </span>
                  </div>
                </div>
                <p className="text-xl break-all text-gray-700">
                  {result.data.email}
                </p>
                {result.data.details.suggestion && (
                  <div className="mt-2 p-2 bg-yellow-50 border rounded border-yellow-200 text-sm">
                    <p className="font-medium text-yellow-800">
                      Did you mean:{" "}
                      <span className="font-bold">
                        {result.data.details.suggestion}
                      </span>
                      ?
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Format</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getIndicatorColor(
                      result.data.details.validFormat
                    )}`}
                  >
                    {result.data.details.validFormat ? "Valid" : "Invalid"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">MX Record</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getIndicatorColor(
                      result.data.details.validMx
                    )}`}
                  >
                    {result.data.details.validMx ? "Valid" : "Invalid"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">SMTP Check</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      result.data.details.validSmtp === null
                        ? "bg-gray-500"
                        : getIndicatorColor(result.data.details.validSmtp)
                    }`}
                  >
                    {result.data.details.validSmtp === null
                      ? "Unknown"
                      : result.data.details.validSmtp
                      ? "Valid"
                      : "Invalid"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Disposable</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getIndicatorColor(
                      result.data.details.isDisposable,
                      true
                    )}`}
                  >
                    {result.data.details.isDisposable ? "Yes" : "No"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Free Email</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      result.data.details.isFree ? "bg-blue-500" : "bg-gray-500"
                    }`}
                  >
                    {result.data.details.isFree ? "Yes" : "No"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Role Account</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getIndicatorColor(
                      result.data.details.isRole,
                      true
                    )}`}
                  >
                    {result.data.details.isRole ? "Yes" : "No"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Accept-All Domain</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getIndicatorColor(
                      result.data.details.isAcceptAll,
                      true
                    )}`}
                  >
                    {result.data.details.isAcceptAll ? "Yes" : "No"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Tagged Address</span>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getIndicatorColor(
                      result.data.details.hasTag,
                      true
                    )}`}
                  >
                    {result.data.details.hasTag ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">Risk Score</h3>
                  <div
                    className={`font-bold text-xl ${getScoreColor(
                      result.data.details.score
                    )}`}
                  >
                    {result.data.details.score}/100
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      result.data.details.score >= 80
                        ? "bg-green-600"
                        : result.data.details.score >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${result.data.details.score}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {result.data.details.reason && (
                    <p>
                      <span className="font-medium">Reason:</span>{" "}
                      {result.data.details.reason
                        .replace(/_/g, " ")
                        .toLowerCase()}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional details section */}
              {result.data.details.mxRecords &&
                result.data.details.mxRecords.length > 0 && (
                  <div className="mt-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Domain MX Records
                    </h3>
                    <div className="max-h-40 overflow-y-auto">
                      <ul className="divide-y divide-gray-200">
                        {result.data.details.mxRecords.map((record, index) => (
                          <li key={index} className="py-2 text-sm">
                            <div className="flex items-center">
                              <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {record.priority}
                              </span>
                              <span className="text-gray-700">
                                {record.exchange || "Unknown"}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              {/* Limitations section */}
              {result.data.details.reason && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    Limitations
                  </h3>
                  <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                    {result.data.details.isAcceptAll && (
                      <li>
                        Catch-all domain: Cannot definitively verify individual
                        mailboxes
                      </li>
                    )}
                    {result.data.details.isDisposable && (
                      <li>
                        Disposable email domain: Likely temporary or anonymous
                        usage
                      </li>
                    )}
                    {result.data.details.isRole && (
                      <li>
                        Role-based account: May be shared by multiple users
                      </li>
                    )}
                    {!result.data.details.validMx && (
                      <li>No valid MX records: Domain cannot receive emails</li>
                    )}
                    {result.data.details.smtpDetails?.timeout && (
                      <li>SMTP timeout: Server response is too slow</li>
                    )}
                    {result.data.details.smtpDetails?.greylisted && (
                      <li>Greylisted: Server temporarily rejecting emails</li>
                    )}
                    {result.data.details.smtpDetails?.quotaExceeded && (
                      <li>Mailbox quota exceeded or rate limited</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notification toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <div
            className={`p-4 rounded-lg shadow-lg flex items-center ${
              notificationMessage.includes("successfully")
                ? "bg-green-100 border-l-4 border-green-500"
                : notificationMessage.includes("risky")
                ? "bg-yellow-100 border-l-4 border-yellow-500"
                : "bg-red-100 border-l-4 border-red-500"
            }`}
          >
            <div className="mr-3">
              {notificationMessage.includes("successfully") ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : notificationMessage.includes("risky") ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex-1 mr-2">
              <p
                className={`text-sm font-medium ${
                  notificationMessage.includes("successfully")
                    ? "text-green-800"
                    : notificationMessage.includes("risky")
                    ? "text-yellow-800"
                    : "text-red-800"
                }`}
              >
                {notificationMessage}
              </p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={handleCloseNotification}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailVerification;
