import jdModel from "../models/jdModel.js";
import Candidate from "../models/candidateModel.js";
import shortListedCandidateModel from "../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import { getCandidateDetailsFromResume, shortListedCandidatesForJD } from "./aiService.js";
import candidateAppliedModel from "../models/candidateAppliedModel.js";

// Utility: timeout wrapper
function withTimeout(promise, ms, msg = "Operation timed out") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

const shortlistCandidatesForJD = async (jdId) => {
  try {
    // Step 1: Find job description
    const job = await jdModel.findById(jdId);
    if (!job) throw new Error("Job Description not found");

    console.log("🚀 Starting shortlisting process for JD ID:", jdId);

    // Step 2: Get all applied candidates
    const appliedCandidates = await candidateAppliedModel.find({ job_id: jdId });
    if (!appliedCandidates.length) {
      console.log("⚠️ No candidates found for this JD.");
      return { message: "No candidates to shortlist." };
    }

    console.log(`🧾 Found ${appliedCandidates.length} applied candidates.`);

    // Step 3: Process candidates concurrently
    const candidateResults = await Promise.allSettled(
      appliedCandidates.map(async (candidate, idx) => {
        try {
          console.log(`\n📄 [${idx + 1}/${appliedCandidates.length}] Processing: ${candidate.resume}`);

          let resumeUrl = candidate.resume;

          // Convert Google Drive links to direct download
          if (resumeUrl.includes("drive.google.com/file/d/")) {
            const match = resumeUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              const fileId = match[1];
              resumeUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
          }

          // Step 4: Parse candidate resume (with timeout)
          const candidateDetails = await withTimeout(
            getCandidateDetailsFromResume(jdId, resumeUrl),
            60000,
            "Resume parsing timeout"
          );

          // Step 5: Save candidate safely
          const newCandidate = new Candidate({
            ...candidateDetails,
            job_id: jdId,
            resume: resumeUrl,
          });

          await withTimeout(newCandidate.save(), 30000, "Candidate save timeout");

          console.log(`✅ Candidate saved: ${candidateDetails.name || "Unnamed"}`);
          return { status: "fulfilled", candidate: newCandidate };
        } catch (err) {
          console.error(`❌ Failed to process candidate: ${candidate.resume}`);
          console.error("Reason:", err.message);
          return { status: "rejected", error: err.message };
        }
      })
    );

    console.log("\n📦 Candidate data extraction completed.");

    // Step 4: Fetch successfully saved candidates
    const savedCandidates = (
      await Candidate.find({ job_id: jdId })
    ).filter(Boolean);

    console.log(`✅ ${savedCandidates.length} candidates saved for JD ${jdId}.`);

    if (!savedCandidates.length) {
      console.log("⚠️ No valid candidates to evaluate.");
      return { message: "No candidates available for AI evaluation." };
    }

    // Step 5: Shortlist candidates using AI
    const shortlistedList = await withTimeout(
      shortListedCandidatesForJD(savedCandidates, job),
      120000,
      "AI shortlisting timeout"
    );

    // Step 6: Save shortlisted results safely
    const shortlistResults = await Promise.allSettled(
      shortlistedList.map(async (data) => {
        try {
          const newShortlisted = new shortListedCandidateModel({
            ...data,
            job_id: jdId,
          });
          await newShortlisted.save();
          console.log(`🏅 Shortlisted saved for candidateId: ${data.candidateId}`);
        } catch (err) {
          console.error("❌ Failed to save shortlisted candidate:", err.message);
        }
      })
    );

    const successfulShortlists = shortlistResults.filter(
      (r) => r.status === "fulfilled"
    ).length;

    console.log(`\n✅ Shortlisting process completed. (${successfulShortlists} shortlisted)`);

    return { message: "Shortlisting process completed.", totalShortlisted: successfulShortlists };
  } catch (error) {
    console.error("💥 Error during shortlisting process:", error);
    throw error;
  }
};

export default shortlistCandidatesForJD;
