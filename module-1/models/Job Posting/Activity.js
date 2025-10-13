import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login',
            'logout',
            'create_job',
            'update_job',
            'delete_job',
            'post_job',
            'approve_job',
            'reject_job',
            'update_settings',
            'change_password',
            'update_profile'
        ]
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    ip_address: String,
    user_agent: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Indexes
activitySchema.index({ user_id: 1, created_at: -1 });
activitySchema.index({ action: 1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;