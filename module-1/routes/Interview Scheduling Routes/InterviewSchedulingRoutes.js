import { Router } from "express";
import {
    createInterviewController,
    getInterviewsController,
    updateInterviewStatusController,
    addFeedbackController,
} from "../../controllers/Interview Scheduling Controllers/InterviewSchedulingController.js";

const router = Router();

// Create interview schedule (AI-assisted)
router.post("/create", createInterviewController);

// Get candidate or interviewer schedules
router.get("/list", getInterviewsController);

// Update interview status (completed, cancelled, etc.)
router.put("/status/:id", updateInterviewStatusController);

// Add feedback post-interview
router.post("/feedback/:id", addFeedbackController);

export default router;
