import express from 'express';
import { Router } from 'express';
import {
    createPosting,
    getAllPostings,
    getPostingById,
    updatePostingStatus,
    getPostingsByJob,
    getPostingsByChannel,
    getPostingMetrics,
    syncPostingMetrics
} from '../../controllers/Job Posting/v1/jobPostingController.js';

const router = Router();

// Job Posting routes - v1
router.post('/v1/postings', /* authMiddleware, */ createPosting);
router.get('/v1/postings', /* authMiddleware, */ getAllPostings);
router.get('/v1/postings/:id', /* authMiddleware, */ getPostingById);
router.put('/v1/postings/:id', /* authMiddleware, */ updatePostingStatus);
router.get('/v1/postings/job/:jobId', /* authMiddleware, */ getPostingsByJob);
router.get('/v1/postings/channel/:channel', /* authMiddleware, */ getPostingsByChannel);

// Metrics routes - v1
router.get('/v1/postings/:id/metrics', /* authMiddleware, */ getPostingMetrics);
router.put('/v1/postings/:id/sync', /* authMiddleware, */ syncPostingMetrics);

export default router;