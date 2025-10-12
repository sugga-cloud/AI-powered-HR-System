import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema(
  {
    approver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "auto_approved"],
      default: "pending",
    },
    remarks: {
      type: String,
      trim: true,
    },
    acted_at: {
      type: Date,
    },
  },
  { _id: false } // prevents auto _id for each subdocument
);

const jobRequisitionSchema = new mongoose.Schema(
  {
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    prompt_text: {
      type: String,
      trim: true,
      required: [true, "Prompt text is required"],
    },

    extracted: {
      title: { type: String, trim: true },
      department: { type: String, trim: true },
      location: { type: String, trim: true },
      experience_level: { type: String, trim: true },
    },

    required_skills: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      trim: true,
    },

    salary_range: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "INR" },
    },

    status: {
      type: String,
      enum: ["initiated", "ai_generated", "approved", "posted", "closed"],
      default: "initiated",
    },

    approval_chain: {
      type: [approvalSchema],
      default: [],
    },

    suggested_channels: {
      type: [String],
      default: [],
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// 🔍 Indexes for faster queries
jobRequisitionSchema.index({ manager_id: 1, status: 1 });
jobRequisitionSchema.index({
  "extracted.title": "text",
  description: "text",
});
jobRequisitionSchema.index({ created_at: -1 });

const JobRequisition = mongoose.model("JobRequisition", jobRequisitionSchema);
export default JobRequisition;