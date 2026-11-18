
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    resetOtpHash: {
      type: String,
      default: null,
    },

    resetOtpExpires: {
      type: Date,
      default: null,
    },

    resetOtpAttempts: {
      type: Number,
      default: 0,
    },

    resetOtpResendCount: {
      type: Number,
      default: 0,
    },

    resetOtpLastSentAt: {
      type: Date,
      default: null,
    },

    resetOtpBlockedUntil: {
      type: Date,
      default: null,
    },
    resetOtpVerifiedAt: {
      type: Date,
      default: null,
    },

      },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
