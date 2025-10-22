import express from 'express';
import { 
    uploadResume, 
    parseResumeUrl, 
    batchUploadResumes 
} from '../../../controllers/Resume Screening/v1/resumeUploadController.js';
import { 
    analyzeResume,
    getAnalysis,
    updateAnalysisFlags,
    getAnalysisSummary
} from '../../../controllers/Resume Screening/v1/resumeAnalysisController.js';
import {
    updateScreeningStatus,
    assignReviewer,
    getWorkflowStatus,
    submitFeedback,
    getScreeningStatistics
} from '../../../controllers/Resume Screening/v1/screeningWorkflowController.js';
import {
    compareResumes,
    matchCandidates,
    generateCandidateProfiles,
    predictCandidateSuccess,
    analyzeCandidatePotential
} from '../../../controllers/Resume Screening/v1/aiIntegrationController.js';
import { authenticate, authorize, requireRole } from '../../../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/resumes');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'application/msword' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Resume Upload Routes
 * Handles resume file uploads and parsing
 */
router.post(
    '/upload',
    authenticate,
    upload.single('resume'),
    uploadResume
);

router.post(
    '/parse-url',
    authenticate,
    parseResumeUrl
);

router.post(
    '/batch-upload',
    authenticate,
    upload.array('resumes', 10),
    batchUploadResumes
);

/**
 * Resume Analysis Routes
 * Handles detailed resume analysis and insights
 */
router.post(
    '/:id/analyze',
    authenticate,
    analyzeResume
);

router.get(
    '/:id/analysis',
    authenticate,
    getAnalysis
);

router.patch(
    '/:id/analysis/flags',
    authenticate,
    requireRole('admin', 'reviewer'),
    updateAnalysisFlags
);

router.get(
    '/analysis/summary',
    authenticate,
    requireRole('admin', 'manager'),
    getAnalysisSummary
);

/**
 * Screening Workflow Routes
 * Handles the screening process and workflow management
 */
router.put(
    '/:resumeId/status',
    authenticate,
    requireRole('admin', 'reviewer'),
    updateScreeningStatus
);

router.post(
    '/:resumeId/assign',
    authenticate,
    requireRole('admin', 'manager'),
    assignReviewer
);

router.get(
    '/:resumeId/workflow',
    authenticate,
    getWorkflowStatus
);

router.post(
    '/:resumeId/feedback',
    authenticate,
    requireRole('admin', 'reviewer'),
    submitFeedback
);

router.get(
    '/statistics',
    authenticate,
    requireRole('admin', 'manager'),
    getScreeningStatistics
);

/**
 * AI Integration Routes
 * Handles advanced AI operations and analysis
 */
router.post(
    '/ai/compare',
    authenticate,
    requireRole('admin', 'reviewer'),
    compareResumes
);

router.post(
    '/ai/match',
    authenticate,
    matchCandidates
);

router.post(
    '/ai/profiles',
    authenticate,
    generateCandidateProfiles
);

router.post(
    '/ai/predict-success',
    authenticate,
    requireRole('admin', 'manager'),
    predictCandidateSuccess
);

router.post(
    '/ai/analyze-potential',
    authenticate,
    requireRole('admin', 'manager'),
    analyzeCandidatePotential
);

// Error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            error: 'File upload error',
            message: err.message
        });
    }
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: err.message
        });
    }

    console.error(err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});

export default router;