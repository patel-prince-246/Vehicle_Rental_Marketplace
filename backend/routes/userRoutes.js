const express = require("express");

const {
  registerUser,
  loginUser,
  getUserProfile,
  uploadDrivingLicense
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const { uploadLicense } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Get logged-in user profile
router.get("/profile", authMiddleware, getUserProfile);

// Upload / update driving license (accepts multipart/form-data or json)
router.post(
  "/license",
  authMiddleware,
  uploadLicense.single("file"),
  uploadDrivingLicense
);

module.exports = router;