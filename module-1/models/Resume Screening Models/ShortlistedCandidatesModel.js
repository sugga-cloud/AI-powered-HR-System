import mongoose from "mongoose";

const schema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    shortlistedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['shortlisted', 'rejected'], default: 'shortlisted' },
    email: { type: String, required: true },
    name: { type: String, required: true },
    resume: { type: String, required: true },
    loginId: { type: String,unqiue: true },
    password: { type: String },
});

export default mongoose.model('ShortlistedCandidate', schema);