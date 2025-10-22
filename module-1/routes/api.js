import { Router } from "express";
import jdRouter from "./jdRoutes.js";
import { authenticate } from "../middleware/authMiddleware.js";
const router = Router();

router.use('/jd', authenticate, jdRouter);
export default router;