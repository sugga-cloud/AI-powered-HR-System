// app.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConfig");

dotenv.config();
connectDB();

const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Base route
app.get("/Healthz", (req, res) => res.send("AI HR Backend Running ✅"));

// Auth Routes
app.use("/api/auth", authRoutes);

module.exports = app;
