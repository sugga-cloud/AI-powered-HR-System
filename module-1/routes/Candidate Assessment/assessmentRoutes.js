import express from 'express';
import { check } from 'express-validator';
import * as assessmentController from '../../controllers/Candidate Assessment/assessmentController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Initialize assessment
router.post('/initialize',
    [
        check('candidateId').notEmpty().withMessage('Candidate ID is required'),
        check('jobPostingId').notEmpty().withMessage('Job Posting ID is required'),
        check('assessmentType').isIn(['mcq', 'coding', 'aptitude', 'video_interview'])
            .withMessage('Invalid assessment type')
    ],
    authorize(['admin', 'hr_manager', 'recruiter']),
    assessmentController.initializeAssessment
);

// Start assessment
router.post('/:id/start',
    authorize(['candidate']),
    assessmentController.startAssessment
);

// Submit assessment
router.post('/:id/submit',
    authorize(['candidate']),
    assessmentController.submitAssessment
);

// Record proctoring violation
router.post('/:assessmentId/violation',
    authorize(['system']),
    assessmentController.recordViolation
);

// Get assessment results
router.get('/:id/results',
    authorize(['admin', 'hr_manager', 'recruiter', 'candidate']),
    assessmentController.getAssessmentResults
);

// Update assessment settings
router.put('/:id/settings',
    authorize(['admin', 'hr_manager']),
    assessmentController.updateAssessmentSettings
);

// Get assessment analytics
router.get('/analytics/:jobPostingId',
    authorize(['admin', 'hr_manager']),
    assessmentController.getAssessmentAnalytics
);

export default router;