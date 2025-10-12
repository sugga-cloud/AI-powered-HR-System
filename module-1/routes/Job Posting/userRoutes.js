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
router.post('/users', /* authMiddleware, */ createUser);
router.get('/users', /* authMiddleware, */ getAllUsers);
router.get('/users/:id', /* authMiddleware, */ getUserById);
router.put('/users/:id', /* authMiddleware, */ updateUser);
router.get('/users/role/:role', /* authMiddleware, */ getUsersByRole);
router.get('/users/department/:department', /* authMiddleware, */ getUsersByDepartment);

export default router;