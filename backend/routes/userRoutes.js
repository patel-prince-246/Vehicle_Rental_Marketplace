const express = require("express");

const {
  registerUser,
  loginUser,
  getUserProfile
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Get logged-in user profile
router.get("/profile", authMiddleware, getUserProfile);


module.exports = router;