
const express = require("express");
const router = express.Router();

const {
  loginUser,
  logoutUser,
} = require("../controllers/authController");

const {
  requestRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
} = require("../controllers/registrationController");

const {
  requestPasswordOtp,
  verifyPasswordOtp,
  resetPassword,
} = require("../controllers/passwordController");


const {
  getProfile,
} = require("../controllers/profileController");

const protect = require("../middleware/authMiddleware");

  router.post("/login", loginUser);
  router.get("/me", protect, getProfile);
  router.post("/logout", logoutUser);

  router.post("/forgot-password", requestPasswordOtp);
  router.post("/verify-otp", verifyPasswordOtp);
  router.post("/reset-password", resetPassword);

  router.post("/register/send-otp", requestRegistrationOtp);
  router.post("/register/verify-otp", verifyRegistrationOtp);
  router.post("/register/resend-otp", resendRegistrationOtp);

module.exports = router;
