import axios from 'axios';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Call global auth service to validate token
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
        const response = await axios.get(`${authServiceUrl}/api/auth/validate`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data && response.data.user) {
            req.user = response.data.user;
            req.token = token;
            next();
        } else {
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth service error:', error.message);
        res.status(401).json({ message: 'Authentication failed' });
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