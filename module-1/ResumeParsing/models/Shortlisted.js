// models/Shortlisted.js
import mongoose from "mongoose";

const shortlistedSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  candidates: [
    {
      candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
      score: Number,
      matchedSkills: [String]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

shortlistedSchema.index({ jobId: 1, createdAt: -1 });

export default mongoose.model("Shortlisted", shortlistedSchema);
