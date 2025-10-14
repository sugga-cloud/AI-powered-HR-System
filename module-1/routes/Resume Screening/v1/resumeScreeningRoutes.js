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
import { authenticateUser, authorizeRole } from '../../../middleware/auth.js';
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
    authenticateUser,
    upload.single('resume'),
    uploadResume
);

router.post(
    '/parse-url',
    authenticateUser,
    parseResumeUrl
);

router.post(
    '/batch-upload',
    authenticateUser,
    upload.array('resumes', 10),
    batchUploadResumes
);

/**
 * Resume Analysis Routes
 * Handles detailed resume analysis and insights
 */
router.post(
    '/:id/analyze',
    authenticateUser,
    analyzeResume
);

router.get(
    '/:id/analysis',
    authenticateUser,
    getAnalysis
);

router.patch(
    '/:id/analysis/flags',
    authenticateUser,
    authorizeRole(['admin', 'reviewer']),
    updateAnalysisFlags
);

router.get(
    '/analysis/summary',
    authenticateUser,
    authorizeRole(['admin', 'manager']),
    getAnalysisSummary
);

/**
 * Screening Workflow Routes
 * Handles the screening process and workflow management
 */
router.put(
    '/:resumeId/status',
    authenticateUser,
    authorizeRole(['admin', 'reviewer']),
    updateScreeningStatus
);

router.post(
    '/:resumeId/assign',
    authenticateUser,
    authorizeRole(['admin', 'manager']),
    assignReviewer
);

router.get(
    '/:resumeId/workflow',
    authenticateUser,
    getWorkflowStatus
);

router.post(
    '/:resumeId/feedback',
    authenticateUser,
    authorizeRole(['admin', 'reviewer']),
    submitFeedback
);

router.get(
    '/statistics',
    authenticateUser,
    authorizeRole(['admin', 'manager']),
    getScreeningStatistics
);

/**
 * AI Integration Routes
 * Handles advanced AI operations and analysis
 */
router.post(
    '/ai/compare',
    authenticateUser,
    authorizeRole(['admin', 'reviewer']),
    compareResumes
);

router.post(
    '/ai/match',
    authenticateUser,
    matchCandidates
);

router.post(
    '/ai/profiles',
    authenticateUser,
    generateCandidateProfiles
);

router.post(
    '/ai/predict-success',
    authenticateUser,
    authorizeRole(['admin', 'manager']),
    predictCandidateSuccess
);

router.post(
    '/ai/analyze-potential',
    authenticateUser,
    authorizeRole(['admin', 'manager']),
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