
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resending, setResending] = useState(false);    
  const [resendCount, setResendCount] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setMessage(response.data.message);
      setOtpSent(true);
      setResendCount(0);
      setSeconds(30);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP.");

      if (err.response?.data?.retryAfterSeconds) {
        setSeconds(err.response.data.retryAfterSeconds);
      }
    }
  };


  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
        const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
        });

        const nextCount = resendCount >= 4 ? 0 : resendCount + 1;
        const delays = [30, 60, 120, 300, 3600];

        setResendCount(nextCount);
        setSeconds(delays[nextCount]);
        setMessage(response.data.message);
    } catch (err) {
        setError(err.response?.data?.message || "Unable to resend OTP.");

        if (err.response?.data?.retryAfterSeconds) {
        setSeconds(err.response.data.retryAfterSeconds);
        }
    } finally {
        setResending(false);
    }
    };

  
const handleVerifyOtp = async (e) => {
  e.preventDefault();

  setError("");
  setMessage("");

  try {
    const response = await api.post("/auth/verify-otp", {
      email: email.trim().toLowerCase(),
      otp,
    });

    setOtpVerified(true);
    setMessage(response.data.message);
  } catch (err) {
    setError(
      err.response?.data?.message || "OTP verification failed."
    );
  }
};


const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    try {
        const response = await api.post("/auth/reset-password", {
        password: newPassword,
        });

        setMessage(response.data.message);
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
        navigate("/");
        }, 2000);
    } catch (err) {
        setError(
        err.response?.data?.message || "Password reset failed."
        );
    }
    };



  return (
    <div className="auth-page">
    <div className="auth-container">
      <h1>Forgot Password</h1>
{!otpSent && (
      <div>
      <p>Enter your registered email to receive an OTP.</p>
    

  
         <form onSubmit={handleSubmit}>
                <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />

                <button type="submit" disabled={seconds > 0}>
                    Send OTP
                </button>
        </form>
    </div>
)}


    {otpSent && !otpVerified && (
        <form onSubmit={handleVerifyOtp}>
            <h3>Verify Your Email</h3>

            <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            inputMode="numeric"
            required
            />

            <button
                type="button"
                onClick={handleResendOtp}
                disabled={seconds > 0 || resending}
                >
                {resending
                    ? "Sending..."
                    : seconds > 0
                    ? `Resend OTP in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                    : "Resend OTP"}
                </button>

            <button type="submit">
            Verify OTP
            </button>
        </form>
        )}


        {otpVerified && (
        <form onSubmit={handleResetPassword}>
            <h3>Create New Password</h3>
<div className="password-field">
            <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                maxLength={15}
                required
                />

                <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                >
                {showNewPassword ? "Hide" : "Show"}
                </button>

</div>
<div className="password-field">
           
            <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                maxLength={15}
                required
                />

                <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                {showConfirmPassword ? "Hide" : "Show"}
                </button>
</div>
            <button type="submit">
            Reset Password
            </button>
        </form>
        )}


      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

    <p>
      Don't have an account? <Link to="/register">Register here</Link>
    </p>

    <p>
    <Link to="/">Back to Login</Link>
    </p>
    </div>
</div>
  );
}

export default ForgotPassword;
