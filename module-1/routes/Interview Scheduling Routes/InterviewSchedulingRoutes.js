import { Router } from "express";
import {
    createInterviewController,
    getInterviewsController,
    updateInterviewStatusController,
    addFeedbackController,
} from "../../controllers/Interview Scheduling Controllers/InterviewSchedulingController.js";

const router = Router();

console.log("📋 Interview Scheduling Routes initialized");

// Create interview schedule (AI-assisted) - supports both single and batch scheduling
router.post("/create", (req, res, next) => {
    console.log("🎯 POST /create - Interview creation endpoint called");
    next();
}, createInterviewController);

// Get candidate or interviewer schedules
router.get("/list", getInterviewsController);

// Update interview status (completed, cancelled, etc.)
router.put("/status/:id", updateInterviewStatusController);

// Add feedback post-interview
router.post("/feedback/:id", addFeedbackController);

export default router;
