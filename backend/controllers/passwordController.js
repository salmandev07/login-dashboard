const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const requestPasswordOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found. Please register first.",
      });
    }

    const now = Date.now();
    const lastSent = user.resetOtpLastSentAt?.getTime() || 0;

    const waitTimes = [
      30 * 1000,
      60 * 1000,
      2 * 60 * 1000,
      5 * 60 * 1000,
    ];

    const waitTime =
      user.resetOtpResendCount >= 4
        ? 60 * 60 * 1000
        : waitTimes[user.resetOtpResendCount];

    const remaining = lastSent + waitTime - now;

    if (lastSent && remaining > 0) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
        retryAfterSeconds: Math.ceil(remaining / 1000),
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(otp)
      .digest("hex");

    user.resetOtpHash = otpHash;
    user.resetOtpExpires = new Date(now + 5 * 60 * 1000);
    user.resetOtpAttempts = 0;
    user.resetOtpLastSentAt = new Date(now);
    user.resetOtpVerifiedAt = null;

    if (lastSent) {
      user.resetOtpResendCount =
        user.resetOtpResendCount >= 4
          ? 0
          : user.resetOtpResendCount + 1;
    }

    await user.save();

    try {
      await sendEmail(
        email,
        "Your Password Reset OTP",
        `<h2>Password Reset</h2>
         <p>Your verification code is:</p>
         <h1>${otp}</h1>
         <p>This code expires in 5 minutes. Do not share it with anyone.</p>`
      );
    } catch (emailError) {
      user.resetOtpHash = null;
      user.resetOtpExpires = null;
      user.resetOtpLastSentAt = null;
      await user.save();
      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "If the account exists, an OTP will be sent.",
    });
  } catch (error) {
    console.error("OTP email error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP. Please try again later.",
    });
  }
};




const verifyPasswordOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !/^\d{6}$/.test(otp || "")) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    if (user.resetOtpExpires.getTime() < Date.now()) {
      user.resetOtpHash = null;
      user.resetOtpExpires = null;
      user.resetOtpAttempts = 0;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (user.resetOtpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    const submittedHash = crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(otp)
      .digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(user.resetOtpHash, "hex")
    );

    if (!valid) {
      user.resetOtpAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
        attemptsRemaining: 5 - user.resetOtpAttempts,
      });
    }

    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;
    user.resetOtpVerifiedAt = new Date();

    await user.save();

    const resetToken = jwt.sign(
      { userId: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.cookie("passwordResetToken", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can reset your password.",
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed.",
    });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.cookies.passwordResetToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please verify your OTP first.",
      });
    }

    if (!password || password.length < 8 || password.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8 to 15 characters.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "password-reset") {
      return res.status(401).json({
        success: false,
        message: "Invalid password reset session.",
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.resetOtpVerifiedAt) {
      return res.status(401).json({
        success: false,
        message: "Please verify your OTP again.",
      });
    }

    user.password = await bcrypt.hash(password, 12);

    user.resetOtpVerifiedAt = null;
    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;
    user.resetOtpResendCount = 0;
    user.resetOtpLastSentAt = null;
    user.resetOtpBlockedUntil = null;

    await user.save();

    res.clearCookie("passwordResetToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
  } catch (error) {
    console.error("Password reset error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Password reset session expired. Verify your OTP again.",
    });
  }
};


module.exports = {
  requestPasswordOtp,
  verifyPasswordOtp,
  resetPassword,
};