import jdModel from "../models/jdModel";
import Candidate from "../models/Candidate.js";
import shortListedCandidateModel from "../models/Resume Screening Models/shortListedCandidatesModel.js";
import { getCandidateDetailsFromResume, shortListedCandidatesForJD } from "./aiService.js";
import candidateAppliedModel from "../models/candidateAppliedModel.js";

const shortlistCandidatesForJD = async (jdId)=>{
    const job = await jdModel.findById(jdId);
    if (!job) {
        throw new Error("Job Description not found");
    }
    const appliedCandidates = await candidateAppliedModel.find({ jdId});
    //extracting and storing candidates data in candidate model
    appliedCandidates.forEach(async (candidate) => {
        const candidateDetails = await getCandidateDetailsFromResume(jdId, candidate.resume);
        const newCandidate = new Candidate({
            ...candidateDetails
        });
        await newCandidate.save();
    });
    const candidates = await Candidate.find({ 'job_id': jdId });
    const list = await shortListedCandidatesForJD(candidates, job);
    list.forEach(async (data)=>{
        const newShortlistedCandidate = new shortListedCandidateModel({
            ...data
        });
        await newShortlistedCandidate.save();
    });
    console.log("Shortlisting process completed.");
    return { message: "Shortlisting process completed." };

}

export default shortlistCandidatesForJD;