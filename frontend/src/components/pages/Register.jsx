import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
   const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (!otpSent || seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, seconds]);



  const handleRegister = async(e) => {
    e.preventDefault();
    setError("");
    setSuccess("");


    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters");
      return;
    }

    if (name.trim().length > 20) {
      setError("Name cannot exceed 50 characters");
      return;
    }


    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }


    if (!password) {
      setError("Please enter a password");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters");
      return;
    }

    if (password.length > 15) {
      setError("Password cannot exceed 15 characters");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character");
      return;
    }

    try {
  setLoading(true);

  const response = await api.post("/auth/register/send-otp", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  setSuccess(response.data.message);
  setOtpSent(true);
  setResendCount(0);
  setSeconds(30);

} catch (error) {
  setError(
    error.response?.data?.message || "Unable to send registration OTP."
  );
} finally {
  setLoading(false);
}
  };


const handleVerifyOtp = async (e) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  try {
    setLoading(true);

    const response = await api.post("/auth/register/verify-otp", {
        email: email.trim().toLowerCase(),
        otp,
      });

      setSuccess(response.data.message);

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      setError(
        error.response?.data?.message || "OTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  };



const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await api.post("/auth/register/resend-otp", {
        email: email.trim().toLowerCase(),
      });

      const nextCount = resendCount >= 4 ? 0 : resendCount + 1;

      const delays = [30, 60, 120, 300, 3600];

      setResendCount(nextCount);
      setSeconds(delays[nextCount]);
      setOtp("");
      setSuccess(response.data.message);

    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to resend registration OTP."
      );

      if (err.response?.data?.retryAfterSeconds) {
        setSeconds(err.response.data.retryAfterSeconds);
      }
    } finally {
      setResending(false);
    }
  };


  return (
    <div className="auth-page">
    <div className="auth-container">
      <div className="login-card">

        <h1>Create Account</h1>
        <p>Register to get started</p>

    
    {error && <p style={{ color: "red" }}>{error}</p>}
    {success && <p style={{ color: "green" }}>{success}</p>}

    {!otpSent ? (
      <form onSubmit={handleRegister}>
        <div>
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="password-field">
          <label>Password</label>
          <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Sending OTP..." : "Register"}
        </button>
      </form>
    ) : (
      <form onSubmit={handleVerifyOtp}>
        <h2>Verify Your Email</h2>
        <p>Enter the 6-digit OTP sent to {email}</p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          inputMode="numeric"
          required
        />

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
            type="button"
            onClick={handleResendOtp}
            disabled={seconds > 0 || resending || loading}
          >
            {resending
              ? "Sending..."
              : seconds > 0
                ? `Resend OTP in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                : "Resend OTP"}
          </button>
      </form>
    )}

        <p className="register-text">
          Already have an account? <Link to="/">Login</Link>
        </p>

      </div>
    </div>
  </div>
  );
}

export default Register;
