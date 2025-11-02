// routes/shortlistingRoutes.js
import express from "express";
import { shortlistCandidates } from "../controllers/shortlistController.js";

const router = express.Router();

// ✅ Test Route
router.get("/test", (req, res) => {
  res.send("✅ Shortlisting route is active");
});

// ✅ Actual Shortlisting
router.post("/run", shortlistCandidates);

export default router;
