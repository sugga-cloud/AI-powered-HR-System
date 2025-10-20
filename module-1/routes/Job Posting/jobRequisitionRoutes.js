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

// Job Requisition routes
router.post('/requisitions', /* authMiddleware, */ createRequisition);
router.get('/requisitions', /* authMiddleware, */ getAllRequisitions);
router.get('/requisitions/:id', /* authMiddleware, */ getRequisitionById);
router.put('/requisitions/:id', /* authMiddleware, */ updateRequisition);
router.delete('/requisitions/:id', /* authMiddleware, */ deleteRequisition);

// Approval chain routes
router.post('/requisitions/:id/approve', /* authMiddleware, */ approveRequisition);
router.post('/requisitions/:id/reject', /* authMiddleware, */ rejectRequisition);

// Search routes
router.get('/requisitions/search/text', /* authMiddleware, */ searchRequisitions);
router.get('/requisitions/manager/:managerId', /* authMiddleware, */ getRequisitionsByManager);
router.get('/requisitions/status/:status', /* authMiddleware, */ getRequisitionsByStatus);

export default router;