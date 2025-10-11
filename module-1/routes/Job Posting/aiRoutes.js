import express from 'express';
import { Router } from 'express';
import {
    processJobRequisition,
    getJobProcessingLogs,
    getLogsByStage,
    getJobPredictions,
    getJobPredictionMetrics,
    regenerateJobPredictions
} from '../../controllers/Job Posting/v1/aiController.js';

const router = Router();

// AI Processing routes - v1
router.post('/v1/ai/process', /* authMiddleware, */ processJobRequisition);
router.get('/v1/ai/logs/:jobId', /* authMiddleware, */ getJobProcessingLogs);
router.get('/v1/ai/logs/stage/:stage', /* authMiddleware, */ getLogsByStage);

// AI Predictions routes - v1
router.get('/v1/ai/predictions/:jobId', /* authMiddleware, */ getJobPredictions);
router.get('/v1/ai/predictions/metrics/:jobId', /* authMiddleware, */ getJobPredictionMetrics);
router.post('/v1/ai/regenerate/:jobId', /* authMiddleware, */ regenerateJobPredictions);

export default router;