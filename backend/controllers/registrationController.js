
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const bcrypt = require("bcryptjs");

const requestRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedName = name?.trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (normalizedName.length < 2 || normalizedName.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 20 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Password must contain 8 to 15 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered. Please log in.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(otp)
      .digest("hex");

    const passwordHash = await bcrypt.hash(password, 12);
    const now = Date.now();

    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        otpHash,
        otpExpiresAt: new Date(now + 5 * 60 * 1000),
        otpAttempts: 0,
        resendCount: 0,
        lastOtpSentAt: new Date(now),
        expiresAt: new Date(now + 2 * 60 * 60 * 1000),
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      }
    );

    try {
      await sendEmail(
        normalizedEmail,
        "Verify Your Email - Registration OTP",
        `<h2>Email Verification</h2>
         <p>Your registration verification code is:</p>
         <h1>${otp}</h1>
         <p>This code expires in 5 minutes. Do not share it with anyone.</p>`
      );
    } catch (emailError) {
      await PendingRegistration.deleteOne({
        email: normalizedEmail,
      });
      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Registration OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send registration OTP. Please try again.",
    });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !/^\d{6}$/.test(otp || "")) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const pending = await PendingRegistration.findOne({ email });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Registration expired. Please register again.",
      });
    }

    if (pending.otpExpiresAt.getTime() < Date.now()) {
      await PendingRegistration.deleteOne({ email });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again.",
      });
    }

    if (pending.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please register again.",
      });
    }

    const submittedHash = crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(otp)
      .digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(pending.otpHash, "hex")
    );

    if (!valid) {
      pending.otpAttempts += 1;
      await pending.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
        attemptsRemaining: 5 - pending.otpAttempts,
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      await PendingRegistration.deleteOne({ email });

      return res.status(409).json({
        success: false,
        message: "Email is already registered. Please log in.",
      });
    }

    await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.passwordHash,
    });

    await PendingRegistration.deleteOne({ email });

    return res.status(201).json({
      success: true,
      message: "Email verified and registration successful. Please log in.",
    });
  } catch (error) {
    console.error("Registration verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration verification failed. Please try again.",
    });
  }
};

const resendRegistrationOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const pending = await PendingRegistration.findOne({ email });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Registration expired. Please register again.",
      });
    }

    const now = Date.now();
    const lastSent = pending.lastOtpSentAt?.getTime() || 0;

    const waitTimes = [
      30 * 1000,
      60 * 1000,
      2 * 60 * 1000,
      5 * 60 * 1000,
    ];

    const waitTime =
      pending.resendCount >= 4
        ? 60 * 60 * 1000
        : waitTimes[pending.resendCount];

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

    await sendEmail(
      email,
      "Your Registration OTP",
      `<h2>Email Verification</h2>
       <p>Your verification code is:</p>
       <h1>${otp}</h1>
       <p>This code expires in 5 minutes.</p>`
    );

    pending.otpHash = otpHash;
    pending.otpExpiresAt = new Date(now + 5 * 60 * 1000);
    pending.otpAttempts = 0;
    pending.lastOtpSentAt = new Date(now);

    pending.resendCount =
      pending.resendCount >= 4
        ? 0
        : pending.resendCount + 1;

    pending.expiresAt = new Date(now + 2 * 60 * 60 * 1000);

    await pending.save();

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Registration resend OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP. Please try again.",
    });
  }
};

module.exports = {
  requestRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
};
