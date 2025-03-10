import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Box,
  Divider,
  Alert,
  TextField,
  Button,
  Snackbar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import EmailIcon from "@mui/icons-material/Email";

export default function EmailVerification() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

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
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify email");
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Valid":
        return "success";
      case "Invalid":
        return "error";
      case "Risky":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Valid":
        return <CheckCircleIcon />;
      case "Invalid":
        return <ErrorIcon />;
      case "Risky":
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6">
          <Typography
            variant="h5"
            component="h1"
            className="font-bold mb-6 flex items-center"
          >
            <EmailIcon className="mr-2" /> Email Verification
          </Typography>

          <form onSubmit={handleSubmit} className="mb-6">
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              disabled={loading}
              className="mb-4"
              placeholder="Enter email to verify"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              className="h-12"
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          {loading && (
            <div className="flex justify-center my-8">
              <CircularProgress />
            </div>
          )}

          {error && !loading && (
            <Alert severity="error" className="my-4">
              {error}
            </Alert>
          )}

          {result && result.success && !loading && (
            <>
              <Divider className="my-4" />

              <div className="flex justify-between items-center mb-6">
                <Typography variant="h6" className="font-medium">
                  Results
                </Typography>
                <Chip
                  icon={getStatusIcon(result.data.status)}
                  label={result.data.status}
                  color={getStatusColor(result.data.status)}
                  className="font-medium"
                />
              </div>

              <Typography variant="h6" className="mb-4 text-gray-700 break-all">
                {result.data.email}
              </Typography>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center">
                  <Typography variant="body1" className="text-gray-600 mr-2">
                    Format:
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      result.data.details.validFormat ? "Valid" : "Invalid"
                    }
                    color={
                      result.data.details.validFormat ? "success" : "error"
                    }
                  />
                </div>

                <div className="flex items-center">
                  <Typography variant="body1" className="text-gray-600 mr-2">
                    MX Record:
                  </Typography>
                  <Chip
                    size="small"
                    label={result.data.details.validMx ? "Valid" : "Invalid"}
                    color={result.data.details.validMx ? "success" : "error"}
                  />
                </div>

                <div className="flex items-center">
                  <Typography variant="body1" className="text-gray-600 mr-2">
                    SMTP:
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      result.data.details.validSmtp === null
                        ? "Unknown"
                        : result.data.details.validSmtp
                        ? "Valid"
                        : "Invalid"
                    }
                    color={
                      result.data.details.validSmtp === null
                        ? "default"
                        : result.data.details.validSmtp
                        ? "success"
                        : "error"
                    }
                  />
                </div>

                <div className="flex items-center">
                  <Typography variant="body1" className="text-gray-600 mr-2">
                    Disposable:
                  </Typography>
                  <Chip
                    size="small"
                    label={result.data.details.isDisposable ? "Yes" : "No"}
                    color={
                      result.data.details.isDisposable ? "error" : "success"
                    }
                  />
                </div>
              </div>

              <Box className="mt-6 bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <Typography variant="body1" className="font-medium">
                    Risk Score
                  </Typography>
                  <Typography
                    variant="h6"
                    className={`font-bold ${getScoreColor(
                      result.data.details.score
                    )}`}
                  >
                    {result.data.details.score}/100
                  </Typography>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2.5 mt-2">
                  <div
                    className={`h-2.5 rounded-full ${
                      result.data.details.score >= 80
                        ? "bg-green-600"
                        : result.data.details.score >= 50
                        ? "bg-yellow-600"
                        : "bg-red-600"
                    }`}
                    style={{ width: `${result.data.details.score}%` }}
                  ></div>
                </div>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={error || "An error occurred"}
      />
    </div>
  );
}
