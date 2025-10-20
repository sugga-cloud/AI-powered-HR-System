import express from 'express';
import { Router } from 'express';
import userRoutes from './userRoutes.js';
import jobRequisitionRoutes from './jobRequisitionRoutes.js';
import aiRoutes from './aiRoutes.js';
import jobPostingRoutes from './jobPostingRoutes.js';
import skillRoutes from './skillRoutes.js';

const router = Router();

// Mount all routes
router.use('/', userRoutes);
router.use('/', jobRequisitionRoutes);
router.use('/', aiRoutes);
router.use('/', jobPostingRoutes);
router.use('/', skillRoutes);

export default router;