import express from 'express';
import { Router } from 'express';
import {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
    searchSkills,
    getPopularSkills,
    batchUpdateSkills
} from '../../controllers/Job Posting/v1/skillController.js';

const router = Router();

// Skills management routes - v1
router.post('/v1/skills', /* authMiddleware, */ createSkill);
router.get('/v1/skills', /* authMiddleware, */ getAllSkills);
router.get('/v1/skills/:id', /* authMiddleware, */ getSkillById);
router.put('/v1/skills/:id', /* authMiddleware, */ updateSkill);
router.get('/v1/skills/search/:term', /* authMiddleware, */ searchSkills);
router.get('/v1/skills/popular', /* authMiddleware, */ getPopularSkills);
router.post('/v1/skills/batch', /* authMiddleware, */ batchUpdateSkills);

export default router;