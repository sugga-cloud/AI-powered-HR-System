import express from 'express';
import { Router } from 'express';
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    getUsersByRole,
    getUsersByDepartment
} from '../../controllers/Job Posting/v1/userController.js';

const router = Router();

// User management routes - v1
router.post('/v1/users', /* authMiddleware, */ createUser);
router.get('/v1/users', /* authMiddleware, */ getAllUsers);
router.get('/v1/users/:id', /* authMiddleware, */ getUserById);
router.put('/v1/users/:id', /* authMiddleware, */ updateUser);
router.get('/v1/users/role/:role', /* authMiddleware, */ getUsersByRole);
router.get('/v1/users/department/:department', /* authMiddleware, */ getUsersByDepartment);

export default router;