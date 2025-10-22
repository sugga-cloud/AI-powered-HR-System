import mongoose from "mongoose";

const jdSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // optional
    },
    prompt: {
      type: String,
      required: true,
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed, // <-- stores any JSON structure
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    platformPosts: [
  {
    platform: String,
    success: Boolean,
    message: String,
    status: { type: String, enum: ["success", "failed"] },
    postedAt: { type: Date, default: Date.now },
  },
],

  },
  { timestamps: true }
);

//arResponse Structure
/*
{
  "jobTitle": "Web Developer",
  "company": "Wribix",
  "location": "Remote",
  "employmentType": "Full-time",
  "skills": ["React", "Node.js", "MongoDB"],
  "experience": "1–3 years",
  "salaryRange": "₹5–8 LPA",
  "aiMetadata": {
    "shortSummary": "Hiring Web Developer skilled in MERN stack.",
    "highlights": ["Work with React & Node.js", "Remote-friendly environment"],
    "hashtags": ["#WebDeveloper", "#MERN"]
  }
}

*/

export default mongoose.model("JD", jdSchema);
