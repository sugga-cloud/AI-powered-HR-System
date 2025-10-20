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

// Job Posting routes
router.post('/postings', /* authMiddleware, */ createPosting);
router.get('/postings', /* authMiddleware, */ getAllPostings);
router.get('/postings/:id', /* authMiddleware, */ getPostingById);
router.put('/postings/:id', /* authMiddleware, */ updatePostingStatus);
router.get('/postings/job/:jobId', /* authMiddleware, */ getPostingsByJob);
router.get('/postings/channel/:channel', /* authMiddleware, */ getPostingsByChannel);

// Metrics routes
router.get('/postings/:id/metrics', /* authMiddleware, */ getPostingMetrics);
router.put('/postings/:id/sync', /* authMiddleware, */ syncPostingMetrics);

export default router;