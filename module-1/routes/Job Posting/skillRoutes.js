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

// Skills management routes
router.post('/skills', /* authMiddleware, */ createSkill);
router.get('/skills', /* authMiddleware, */ getAllSkills);
router.get('/skills/:id', /* authMiddleware, */ getSkillById);
router.put('/skills/:id', /* authMiddleware, */ updateSkill);
router.get('/skills/search/:term', /* authMiddleware, */ searchSkills);
router.get('/skills/popular', /* authMiddleware, */ getPopularSkills);
router.post('/skills/batch', /* authMiddleware, */ batchUpdateSkills);

export default router;