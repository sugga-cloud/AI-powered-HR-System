import { Router } from "express";
import jdRouter from "./jdRoutes.js";
import caRouter from "./Candidate Assessment Routes/CandidateAssessmentRoutes.js";
import isRouter from "./Interview Scheduling Routes/InterviewSchedulingRoutes.js";
import ooRouter from "./Offer and Onboarding Routes/offerRoutes.js";
import { authenticate } from "../middleware/authMiddleware.js";
const router = Router();

router.use('/jd', authenticate, jdRouter);
router.use('/ca', authenticate, caRouter);
router.use('/is', authenticate, isRouter);
router.use('/oo', authenticate, ooRouter);
export default router;