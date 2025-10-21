// utils/generateToken.js
const jwt = require("jsonwebtoken");

// Generate JWT token for user authentication
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES_IN || "1d" }
  );
};

module.exports = generateToken;
