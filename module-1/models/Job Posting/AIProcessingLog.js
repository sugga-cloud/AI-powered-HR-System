import mongoose from "mongoose";

const aiProcessingLogSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobRequisition",
    required: true,
  },
  stage: {
    type: String,
    enum: ["prompt_parsing", "jd_generation", "skill_prediction", "timeline_prediction"],
    required: true,
  },
  input_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  output_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  model_version: {
    type: String,
    required: true,
  },
  processed_at: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster queries
aiProcessingLogSchema.index({ job_id: 1 });
aiProcessingLogSchema.index({ stage: 1, processed_at: -1 });

const AIProcessingLog = mongoose.model("AIProcessingLog", aiProcessingLogSchema);
export default AIProcessingLog;