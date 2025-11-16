import mongoose from 'mongoose';

const Schema = new mongoose.Schema(
  {
    resume: { type: String }, // Storing URL of the resume
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JD', // Reference to Job Description model
        required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('CandidateApplied', Schema);
