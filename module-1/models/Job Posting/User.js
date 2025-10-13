import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false // Don't include password in query results by default
    },
    role: {
      type: String,
      enum: ["admin", "manager", "hr_specialist", "hiring_manager", "recruiter", "approver"],
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    permissions: [{
      type: String,
      enum: [
        'create_job',
        'edit_job',
        'delete_job',
        'view_jobs',
        'approve_jobs',
        'post_jobs',
        'view_analytics',
        'manage_users',
        'manage_settings'
      ]
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    lastLogin: Date,
    metadata: {
      phone: String,
      title: String,
      location: String,
      timezone: String,
      profileImage: String,
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true }
      }
    },
    settings: {
      defaultJobTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'JobTemplate' },
      preferredChannels: [String],
      autoPostEnabled: { type: Boolean, default: false },
      approvalRequired: { type: Boolean, default: true }
    }
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual fields
userSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Set default permissions based on role
    if (this.isModified('role')) {
        this.permissions = this.getDefaultPermissions();
    }

    next();
});

// Instance methods
userSchema.methods = {
    // Compare password
    comparePassword: async function(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    },

    // Generate JWT token
    generateAuthToken: function() {
        return jwt.sign(
            { 
                id: this._id,
                role: this.role,
                permissions: this.permissions
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    },

    // Check if user has specific permission
    hasPermission: function(permission) {
        return this.permissions.includes(permission);
    },

    // Get default permissions based on role
    getDefaultPermissions: function() {
        const permissions = new Set(['view_jobs']);

        switch (this.role) {
            case 'admin':
                permissions.add('create_job');
                permissions.add('edit_job');
                permissions.add('delete_job');
                permissions.add('approve_jobs');
                permissions.add('post_jobs');
                permissions.add('view_analytics');
                permissions.add('manage_users');
                permissions.add('manage_settings');
                break;
            case 'hr_specialist':
                permissions.add('create_job');
                permissions.add('edit_job');
                permissions.add('post_jobs');
                permissions.add('view_analytics');
                break;
            case 'hiring_manager':
                permissions.add('create_job');
                permissions.add('edit_job');
                permissions.add('view_analytics');
                break;
            case 'recruiter':
                permissions.add('create_job');
                permissions.add('edit_job');
                permissions.add('post_jobs');
                break;
            case 'approver':
                permissions.add('approve_jobs');
                permissions.add('view_analytics');
                break;
        }

        return Array.from(permissions);
    },

    // Update last login
    updateLastLogin: async function() {
        this.lastLogin = new Date();
        return this.save();
    }
};

// Static methods
userSchema.statics = {
    // Find active users by role
    findActiveByRole: function(role) {
        return this.find({ role, status: 'active' });
    },

    // Find users by permission
    findByPermission: function(permission) {
        return this.find({ permissions: permission, status: 'active' });
    },

    // Get users with pending approvals
    getApprovers: function() {
        return this.find({
            permissions: 'approve_jobs',
            status: 'active'
        });
    }
};

// Indexes for faster queries
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ department: 1 });
userSchema.index({ permissions: 1 });

const User = mongoose.model("User", userSchema);
export default User;