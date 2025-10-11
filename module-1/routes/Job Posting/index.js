import express from 'express';
import { Router } from 'express';
import userRoutes from './userRoutes';
import jobRequisitionRoutes from './jobRequisitionRoutes';
import aiRoutes from './aiRoutes';
import jobPostingRoutes from './jobPostingRoutes';
import skillRoutes from './skillRoutes';

const router = Router();

// Mount all routes
router.use('/api/v1', userRoutes);
router.use('/api/v1', jobRequisitionRoutes);
router.use('/api/v1', aiRoutes);
router.use('/api/v1', jobPostingRoutes);
router.use('/api/v1', skillRoutes);

export default router;