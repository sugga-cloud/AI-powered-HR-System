// models/Candidate.js
import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  skills: { type: [String], default: [] },
  experience: { type: Number, default: 0 },
  projects: { type: Number, default: 0 },
  educationLevel: { type: String },
  rawText: { type: String },
  atsScore: { type: Number, default: 0 },
  parsedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Candidate", CandidateSchema);
