import express from 'express';
import { Router } from 'express';
import {
    createRequisition,
    getAllRequisitions,
    getRequisitionById,
    updateRequisition,
    deleteRequisition,
    approveRequisition,
    rejectRequisition,
    searchRequisitions,
    getRequisitionsByManager,
    getRequisitionsByStatus
} from '../../controllers/Job Posting/v1/jobRequisitionController.js';

const router = Router();

// Job Requisition routes - v1
router.post('/v1/requisitions', /* authMiddleware, */ createRequisition);
router.get('/v1/requisitions', /* authMiddleware, */ getAllRequisitions);
router.get('/v1/requisitions/:id', /* authMiddleware, */ getRequisitionById);
router.put('/v1/requisitions/:id', /* authMiddleware, */ updateRequisition);
router.delete('/v1/requisitions/:id', /* authMiddleware, */ deleteRequisition);

// Approval chain routes - v1
router.post('/v1/requisitions/:id/approve', /* authMiddleware, */ approveRequisition);
router.post('/v1/requisitions/:id/reject', /* authMiddleware, */ rejectRequisition);

// Search routes - v1
router.get('/v1/requisitions/search/text', /* authMiddleware, */ searchRequisitions);
router.get('/v1/requisitions/manager/:managerId', /* authMiddleware, */ getRequisitionsByManager);
router.get('/v1/requisitions/status/:status', /* authMiddleware, */ getRequisitionsByStatus);

export default router;