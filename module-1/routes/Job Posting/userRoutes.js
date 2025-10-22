import express from 'express';
import {
    login,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    changePassword,
    updateUserStatus,
    updateUserPermissions,
    getUserActivity,
    getUsersByRole,
    getUsersByDepartment
} from '../../controllers/Job Posting/v1/userController.js';
import { authenticate, authorize, requireRole } from '../../middleware/auth.js';
import { logActivity } from '../../utils/activityLogger.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes - require authentication
router.use(authenticate);

// User profile routes - any authenticated user
router.get('/me', async (req, res) => {
    try {
        const user = await req.user.populate('department').execPopulate();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/me/password', changePassword);

// User management routes - require manage_users permission
router.post('/users', 
    authorize('manage_users'), 
    createUser
);

router.get('/users', 
    authorize('manage_users'), 
    getAllUsers
);

router.get('/users/:id', 
    authorize('manage_users'), 
    getUserById
);

router.put('/users/:id', 
    authorize('manage_users'), 
    updateUser
);

// Advanced user management - admin only
router.put('/users/:id/status', 
    requireRole('admin'), 
    updateUserStatus
);

router.put('/users/:id/permissions', 
    requireRole('admin'), 
    updateUserPermissions
);

// User filtering routes - require view_users permission
router.get('/users/role/:role', 
    authorize('view_users'), 
    getUsersByRole
);

router.get('/users/department/:department', 
    authorize('view_users'), 
    getUsersByDepartment
);

// Activity tracking
router.get('/users/:id/activity', 
    authorize('manage_users'), 
    getUserActivity
);

// Add activity logging middleware for sensitive operations
router.use(['/users/:id/status', '/users/:id/permissions'], async (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        logActivity(req.user._id, req.method === 'PUT' ? 'update_user' : 'view_user', {
            target_user: req.params.id,
            changes: req.body
        }, req);
        originalJson.call(this, data);
    };
    next();
});

export default router;