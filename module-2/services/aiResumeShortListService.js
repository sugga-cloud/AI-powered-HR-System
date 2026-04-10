import jdModel from "../models/jdModel.js";
import Candidate from "../models/candidateModel.js";
import shortListedCandidateModel from "../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import { getCandidateDetailsFromResume, shortListedCandidatesForJD } from "./aiService.js";
import candidateAppliedModel from "../models/candidateAppliedModel.js";
import fs from "fs";
import path from "path";

// Utility: timeout wrapper
function withTimeout(promise, ms, msg = "Operation timed out") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

const isUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const resolveResumeSource = (resume) => {
  if (isUrl(resume)) return resume;
  const absolutePath = path.resolve("", resume);
  if (!fs.existsSync(absolutePath)) throw new Error(`Resume file not found at ${absolutePath}`);
  return absolutePath;
};

export const processAppliedCandidatesForJD = async (jdId) => {
  try {
    const job = await jdModel.findById(jdId);
    if (!job) throw new Error("Job Description not found");

    console.log("🚀 Processing applied candidates for JD:", jdId);
    const appliedCandidates = await candidateAppliedModel.find({ job_id: jdId });

    if (!appliedCandidates.length) return { message: "No candidates to process." };

    const results = await Promise.allSettled(
      appliedCandidates.map(async (candidate) => {
        try {
          // 1. Check if we already have a structured Candidate for this raw application
          const existingCandidate = await Candidate.findOne({ 
            $or: [
              { resume: candidate.resume },
              { candidate_applied_id: candidate._id } // Link to source
            ]
          });
          
          if (existingCandidate) {
            console.log(`⏩ Skipping duplicate for application ${candidate._id}`);
            return existingCandidate;
          }

          let resumeSource = resolveResumeSource(candidate.resume);
          let buffer = null;
          if (!isUrl(resumeSource)) buffer = await fs.promises.readFile(resumeSource);

          const candidateDetails = await withTimeout(
            getCandidateDetailsFromResume(jdId, resumeSource, buffer),
            60000,
            "Resume parsing timeout"
          );

          console.log(`✨ AI Extracted: ${candidateDetails.name} (${candidateDetails.email})`);

          const newCandidate = new Candidate({
            ...candidateDetails,
            job_id: jdId,
            candidate_applied_id: candidate._id, // Back-reference
            resume: candidate.resume,
            resume_source_type: isUrl(candidate.resume) ? "url" : "upload",
            status: "new"
          });

          await withTimeout(newCandidate.save(), 30000, "Candidate save timeout");
          console.log(`✅ Candidate ${candidateDetails.name} saved to database.`);
          return newCandidate;
        } catch (err) {
          console.error(`❌ Failed to process application ${candidate._id}:`, err.message);
          throw err;
        }
      })
    );

    return { message: "Candidate processing completed.", totalProcessed: results.length, totalSaved: results.filter(r => r.status === "fulfilled").length };
  } catch (error) {
    console.error("💥 Error while processing candidates:", error);
    throw error;
  }
};

const shortlistCandidatesForJD = async (jdId) => {
  try {
    const job = await jdModel.findById(jdId);
    if (!job) throw new Error("Job Description not found");

    console.log("🏅 Starting AI shortlisting for JD:", jdId);
    const savedCandidates = await Candidate.find({ job_id: jdId });

    if (!savedCandidates.length) return { message: "No candidates available for shortlisting." };

    const shortlistedList = await withTimeout(
      shortListedCandidatesForJD(savedCandidates, job),
      120000,
      "AI shortlisting timeout"
    );

    const saveResults = await Promise.allSettled(
      shortlistedList.map(async (data) => {
        // Fix jobId consistency (ShortlistedCandidatesModel uses jobId)
        const shortlisted = new shortListedCandidateModel({ ...data, jobId: jdId });
        await shortlisted.save();
      })
    );

    return { message: "Shortlisting process completed.", totalShortlisted: saveResults.filter(r => r.status === "fulfilled").length };
  } catch (error) {
    console.error("💥 Error during shortlisting:", error);
    throw error;
  }
};

export default shortlistCandidatesForJD;
