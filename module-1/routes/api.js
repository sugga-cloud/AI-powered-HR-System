import { Router } from "express";
import jdRouter from "./jdRoutes.js";
import caRouter from "./Candidate Assessment Routes/CandidateAssessmentRoutes.js";
import { authenticate } from "../middleware/authMiddleware.js";
const router = Router();

router.use('/jd', authenticate, jdRouter);
router.use('/ca',authenticate, caRouter);
export default router;