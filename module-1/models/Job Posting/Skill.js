import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  aliases: {
    type: [String],
    default: [],
  },
  popularity_score: {
    type: Number,
    default: 0,
    min: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster queries
skillSchema.index({ name: 1 }, { unique: true });
skillSchema.index({ aliases: 1 });

const Skill = mongoose.model("Skill", skillSchema);
export default Skill;