import { Router } from "express";
import jdRouter from "./jdRoutes.js";
import caRouter from "./Candidate Assessment Routes/CandidateAssessmentRoutes.js";
import isRouter from "./Interview Scheduling Routes/InterviewSchedulingRoutes.js";
import ooRouter from "./Offer and Onboarding Routes/offerRoutes.js";
import { authenticate } from "../middleware/authMiddleware.js";
import rsRouter from "./Resume  Shortlisting Routes/resumeRoutes.js";
import multer from 'multer';
import { applyToJob } from '../controllers/resumeController/applyController.js';
const router = Router();
// Configure how files are stored
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// POST route: 'resume' must match the key used in Frontend FormData
router.post('/apply', upload.single('resume'), applyToJob);
router.get('/healthz', (req, res) => {
    res.json({ status: 'API is healthy' });
});

console.log("✅ Interview Scheduling Router mounted at /is");

router.use('/jd', authenticate, jdRouter);
router.use('/ca', authenticate, caRouter);
router.use('/is', (req, res, next) => {
    console.log(`📍 IS Route: ${req.method} ${req.path}`);
    next();
}, isRouter);
router.use('/oo', authenticate, ooRouter);
router.use('/rs', rsRouter);
export default router;