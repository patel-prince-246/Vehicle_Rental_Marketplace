const express = require("express");

const {
  sendRegistrationOtp,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadDrivingLicense,
  logoutUser,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const { uploadLicense, uploadAvatar } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Email OTP verification for Registration (Gmail SMTP)
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/send-otp", sendRegistrationOtp);

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Logout
router.post("/logout", authMiddleware, logoutUser);

// Get logged-in user profile
router.get("/profile", authMiddleware, getUserProfile);

// Update user profile (SRS 3.1.1.3)
router.put("/profile", authMiddleware, uploadAvatar.single("avatar"), updateUserProfile);

// Upload / update driving license (accepts multipart/form-data or json)
router.post(
  "/license",
  authMiddleware,
  uploadLicense.single("file"),
  uploadDrivingLicense
);

module.exports = router;