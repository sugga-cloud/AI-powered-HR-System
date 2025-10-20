import jwt from 'jsonwebtoken';
import User from '../models/Job Posting/User.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id, status: 'active' });

        if (!user) {
            throw new Error('User not found or inactive');
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

export const authorize = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const hasAllPermissions = permissions.every(permission => 
            req.user.permissions.includes(permission)
        );

        if (!hasAllPermissions) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient role permissions' });
        }

        next();
    };
};

export const checkJobOwnership = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const job = await JobRequisition.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Allow if user is admin or has manage_users permission
        if (req.user.role === 'admin' || req.user.hasPermission('manage_users')) {
            return next();
        }

        // Check if user is the creator or in the same department
        if (job.created_by.toString() === req.user._id.toString() || 
            job.department === req.user.department) {
            return next();
        }

        res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};