import Activity from '../models/Job Posting/Activity.js';

export const logActivity = async (userId, action, details, req) => {
    try {
        const activity = new Activity({
            user_id: userId,
            action,
            details,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        await activity.save();
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

export const getActivitiesByUser = async (userId, page = 1, limit = 10) => {
    try {
        const activities = await Activity.find({ user_id: userId })
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Activity.countDocuments({ user_id: userId });

        return {
            activities,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting user activities:', error);
        throw error;
    }
};

export const getActivitiesByAction = async (action, page = 1, limit = 10) => {
    try {
        const activities = await Activity.find({ action })
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('user_id', 'name email role');

        const total = await Activity.countDocuments({ action });

        return {
            activities,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting activities by action:', error);
        throw error;
    }
};

export const getRecentActivities = async (limit = 10) => {
    try {
        return await Activity.find()
            .sort({ created_at: -1 })
            .limit(limit)
            .populate('user_id', 'name email role');
    } catch (error) {
        console.error('Error getting recent activities:', error);
        throw error;
    }
};