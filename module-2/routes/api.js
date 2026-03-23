import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import VoiceRouter from "./process/voiceRoutes.js";
import test from "./test.js";
import agentRouter from "./agentRoutes.js";
const router = Router();

router.get('/healthz', (req, res) => {
    res.json({ status: 'API is healthy' });
});
router.use('/agent', agentRouter);
router.use('/test', test);
router.use('/process',VoiceRouter);

export default router;