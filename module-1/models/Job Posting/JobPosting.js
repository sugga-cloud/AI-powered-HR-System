import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobRequisition",
    required: true,
  },
  channel: {
    type: String,
    enum: ["linkedin", "naukri", "indeed", "internal"],
    required: true,
  },
  post_url: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "posted", "failed", "expired", "closed"],
    default: "pending",
  },
  external_id: {
    type: String,
    trim: true,
  },
  external_data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  visibility: {
    type: String,
    enum: ["public", "private", "company_only"],
    default: "public"
  },
  response_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  metrics: {
    clicks: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    applies: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    saves: { type: Number, default: 0, min: 0 },
    conversion_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  sync_status: {
    last_synced_at: Date,
    next_sync_at: Date,
    sync_error: String,
    retry_count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  posting_details: {
    start_date: Date,
    end_date: Date,
    auto_renew: {
      type: Boolean,
      default: false
    },
    budget: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      type: {
        type: String,
        enum: ['daily', 'total'],
        default: 'total'
      }
    }
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

// Pre-save middleware
jobPostingSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Calculate conversion rate
  if (this.metrics.views > 0) {
    this.metrics.conversion_rate = (this.metrics.applies / this.metrics.views) * 100;
  }
  
  next();
});

// Instance methods
jobPostingSchema.methods.updateMetrics = async function(newMetrics) {
  Object.assign(this.metrics, newMetrics);
  this.sync_status.last_synced_at = new Date();
  this.sync_status.next_sync_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next sync in 24 hours
  return this.save();
};

jobPostingSchema.methods.close = async function(reason) {
  this.status = 'closed';
  this.external_data.set('close_reason', reason);
  return this.save();
};

jobPostingSchema.methods.renewPosting = async function(duration) {
  if (this.status === 'expired' || this.status === 'closed') {
    this.status = 'pending';
    this.posting_details.start_date = new Date();
    this.posting_details.end_date = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    return this.save();
  }
  throw new Error('Can only renew expired or closed postings');
};

// Static methods
jobPostingSchema.statics.findActiveByChannel = function(channel) {
  return this.find({
    channel,
    status: 'posted',
    'posting_details.end_date': { $gt: new Date() }
  });
};

jobPostingSchema.statics.findDueForSync = function() {
  return this.find({
    status: 'posted',
    'sync_status.next_sync_at': { $lte: new Date() }
  });
};

jobPostingSchema.statics.getChannelMetrics = async function(channel, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        channel,
        created_at: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPostings: { $sum: 1 },
        totalViews: { $sum: '$metrics.views' },
        totalClicks: { $sum: '$metrics.clicks' },
        totalApplies: { $sum: '$metrics.applies' },
        avgConversionRate: { $avg: '$metrics.conversion_rate' }
      }
    }
  ]);
};

// Indexes for faster queries
jobPostingSchema.index({ job_id: 1, channel: 1 });
jobPostingSchema.index({ external_id: 1 });
jobPostingSchema.index({ status: 1, 'sync_status.next_sync_at': 1 });
jobPostingSchema.index({ channel: 1, status: 1, 'posting_details.end_date': 1 });

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);
export default JobPosting;