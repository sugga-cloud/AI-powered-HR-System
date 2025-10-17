// routes/authRoutes.js
const express = require("express");
const { registerUser, loginUser, validateToken } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Validate Token
router.get("/validate", protect, validateToken);

module.exports = router;
