// models/Job.js
import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  title: String,
  description: String,
  requiredSkills: { type: [String], default: [] },
  minExperience: { type: Number, default: 0 },
  minProjects: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Job", JobSchema);
