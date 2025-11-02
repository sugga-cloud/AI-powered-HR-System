// routes/resumeRoutes.js
import express from "express";
import { upload } from "../middleware/uploadResume.js";
import { uploadResumes } from "../controllers/resumeController.js";
import Candidate from "../models/Candidate.js";

const router = express.Router();

// UPLOAD resumes
router.post("/upload", upload.array("resumes", 50), uploadResumes);

// VIEW stored candidates
router.get("/", async (req, res) => {
  const data = await Candidate.find();
  res.json(data);
});

export default router;
