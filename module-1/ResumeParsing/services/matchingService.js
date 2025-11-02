// services/matchingService.js
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import Shortlisted from "../models/Shortlisted.js";

/**
 * Calculate score for a candidate for given job
 * - skill score: 10 per matched skill
 * - experience: +5 if meets minExperience
 * - projects: +5 if meets minProjects
 */
function calculateScoreAndMatchedSkills(job, candidate) {
  let score = 0;
  const matchedSkills = [];

  const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
  (candidate.skills || []).forEach(skillObj => {
    // candidate.skills could be array of strings
    const s = (typeof skillObj === "string" ? skillObj : skillObj.name || "").toLowerCase();
    if (s && jobSkills.includes(s)) {
      score += 10;
      matchedSkills.push(s);
    }
  });

  if ((candidate.experience || 0) >= (job.minExperience || 0)) score += 5;
  if ((candidate.projects || 0) >= (job.minProjects || 0)) score += 5;

  return { score, matchedSkills };
}

/**
 * Main: match candidates for a job, save top `limit` into Shortlisted
 */
export async function matchCandidates(jobId, limit = 10) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error("Job not found");

  const candidates = await Candidate.find({}); // consider filtering by jobId if desired

  const scored = candidates.map(c => {
    const { score, matchedSkills } = calculateScoreAndMatchedSkills(job, c);
    return {
      candidateId: c._id,
      score,
      matchedSkills
    };
  });

  const top = scored.sort((a, b) => b.score - a.score).slice(0, limit);

  // Save to Shortlisted collection
  const saved = await Shortlisted.create({
    jobId,
    candidates: top
  });

  // Also update the candidate documents with atsScore (optional)
  const bulkOps = top.map(t => ({
    updateOne: {
      filter: { _id: t.candidateId },
      update: { $set: { atsScore: t.score } }
    }
  }));
  if (bulkOps.length) await Candidate.bulkWrite(bulkOps);

  return saved;
}
