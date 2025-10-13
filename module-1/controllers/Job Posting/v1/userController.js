import User from '../../../models/Job Posting/User.js';
import Activity from '../../../models/Job Posting/Activity.js';
import { validateEmail, validatePassword } from '../../../utils/validation.js';
import { logActivity } from '../../../utils/activityLogger.js';

/**
 * Authentication Controllers
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user and include password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check user status
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Account is not active' });
        }

        // Generate token and update last login
        const token = user.generateAuthToken();
        await user.updateLastLogin();

        // Remove sensitive data
        user.password = undefined;

        res.json({
            user,
            token,
            permissions: user.permissions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new user (Admin only)
export const createUser = async (req, res) => {
    try {
        const { email, password, name, role, department } = req.body;

        // Validate input
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters long and contain letters, numbers, and special characters' 
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = new User({
            ...req.body,
            status: 'active',
            created_by: req.user._id
        });

        await user.save();

        // Remove sensitive data
        user.password = undefined;

        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all users with filtering and pagination
export const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            role, 
            department, 
            status,
            search 
        } = req.query;

        const query = {};

        // Apply filters
        if (role) query.role = role;
        if (department) query.department = department;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Get users with pagination
        const users = await User.find(query)
            .select('-password')
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const updates = req.body;
        const userId = req.params.id;

        // Prevent updating sensitive fields unless admin
        if (!req.user.hasPermission('manage_users')) {
            delete updates.role;
            delete updates.permissions;
            delete updates.status;
        }

        // Don't allow password updates through this endpoint
        delete updates.password;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Validate new password
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                message: 'New password must be at least 8 characters long and contain letters, numbers, and special characters' 
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update user status
export const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.params.id;

        // Prevent self-status update
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot update own status' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    status,
                    updated_by: req.user._id,
                    status_updated_at: new Date()
                }
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update user permissions
export const updateUserPermissions = async (req, res) => {
    try {
        const { permissions } = req.body;
        const userId = req.params.id;

        // Validate permissions
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ message: 'Permissions must be an array' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    permissions,
                    updated_by: req.user._id
                }
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get user activity log
export const getUserActivity = async (req, res) => {
    try {
        const userId = req.params.id;
        const { page = 1, limit = 10 } = req.query;

        const activities = await Activity.find({ user_id: userId })
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments({ user_id: userId });

        res.json({
            activities,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
    try {
        const users = await User.find({ role: req.params.role });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get users by department
export const getUsersByDepartment = async (req, res) => {
    try {
        const users = await User.find({ department: req.params.department });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};