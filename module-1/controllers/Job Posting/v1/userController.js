import User from '../../../models/Job Posting/User.js';

// Create a new user
export const createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all users with optional filtering
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find(req.query);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
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
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { 
            new: true,
            runValidators: true
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
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