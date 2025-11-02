import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import Shortlisted from "../models/Shortlisted.js";

export async function shortlistByJob(jobId) {
  const job = await Job.findById(jobId);
  if (!job) return "❌ Job not found";

  const candidates = await Candidate.find();
  if (!candidates.length) return "❌ No candidates available";

  const result = [];

  for (const cand of candidates) {
    const matched = cand.skills.filter(skill =>
      job.requiredSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
    );

    const skillMatchPercent = (matched.length / job.requiredSkills.length) * 100;

    let projExpScore = 0;
    if (cand.experience >= 1) projExpScore += 5;
    if (cand.projects >= 1) projExpScore += 5;

    const finalScore =
      (skillMatchPercent * 0.5) +
      (cand.atsScore * 0.4) +
      (projExpScore * 0.1);

    if (finalScore >= job.minScore) {
      result.push({
        candidateId: cand._id,
        score: finalScore,
        matchedSkills: matched
      });
    }
  }

  // ✅ Save only once per job
  await Shortlisted.create({
    jobId,
    candidates: result
  });

  return "✅ Shortlisting Completed";
}
