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

// AI Processing routes
router.post('/ai/process', /* authMiddleware, */ processJobRequisition);
router.get('/ai/logs/:jobId', /* authMiddleware, */ getJobProcessingLogs);
router.get('/ai/logs/stage/:stage', /* authMiddleware, */ getLogsByStage);

// AI Predictions routes
router.get('/ai/predictions/:jobId', /* authMiddleware, */ getJobPredictions);
router.get('/ai/predictions/metrics/:jobId', /* authMiddleware, */ getJobPredictionMetrics);
router.post('/ai/regenerate/:jobId', /* authMiddleware, */ regenerateJobPredictions);

export default router;