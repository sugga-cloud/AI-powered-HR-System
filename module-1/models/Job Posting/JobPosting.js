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
    enum: ["pending", "posted", "failed"],
    default: "pending",
  },
  external_id: {
    type: String,
    trim: true,
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
  },
  last_synced_at: Date,
  created_at: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster queries
jobPostingSchema.index({ job_id: 1, channel: 1 });
jobPostingSchema.index({ external_id: 1 });

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);
export default JobPosting;