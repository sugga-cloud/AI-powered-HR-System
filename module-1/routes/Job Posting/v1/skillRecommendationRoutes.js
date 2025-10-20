import express from 'express';
import {
    getSkillRecommendations,
    analyzeSkillsGap,
    updateSkillMetrics,
    getSkillInsights
} from '../../../controllers/Job Posting/v1/skillRecommendationController.js';
import { authenticateUser, authorizeRole } from '../../../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/v1/skills/recommendations
 * @desc    Get skill recommendations based on job description and requirements
 * @access  Private
 */
router.post(
    '/recommendations',
    authenticateUser,
    getSkillRecommendations
);

/**
 * @route   POST /api/v1/skills/gap-analysis
 * @desc    Analyze skills gap for a target role
 * @access  Private
 */
router.post(
    '/gap-analysis',
    authenticateUser,
    analyzeSkillsGap
);

/**
 * @route   PUT /api/v1/skills/metrics
 * @desc    Update skill metrics (trends, relevance)
 * @access  Private/Admin
 */
router.put(
    '/metrics',
    authenticateUser,
    authorizeRole(['admin']),
    updateSkillMetrics
);

/**
 * @route   GET /api/v1/skills/:skillId/insights
 * @desc    Get detailed insights for a specific skill
 * @access  Private
 */
router.get(
    '/:skillId/insights',
    authenticateUser,
    getSkillInsights
);

export default router;