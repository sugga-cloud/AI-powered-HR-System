import mongoose from "mongoose";

const aiPredictionSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobRequisition",
    required: true,
  },
  predicted_time_to_hire_days: {
    type: Number,
    required: true,
    min: 0,
  },
  candidate_availability_score: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  suggested_channels: {
    type: [String],
    default: [],
  },
  feature_vectors: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  model_version: {
    type: String,
    required: true,
  },
  generated_at: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster queries
aiPredictionSchema.index({ job_id: 1 });
aiPredictionSchema.index({ generated_at: -1 });

const AIPrediction = mongoose.model("AIPrediction", aiPredictionSchema);
export default AIPrediction;