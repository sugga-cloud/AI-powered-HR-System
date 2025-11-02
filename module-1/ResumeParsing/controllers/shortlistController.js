import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import Shortlisted from "../models/Shortlisted.js";

export const shortlistCandidates = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: "jobId is required" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const requiredSkills = job.requiredSkills || [];

    const candidates = await Candidate.find();
    if (!candidates.length)
      return res.status(404).json({ error: "No candidates found" });

    const shortlisted = candidates
      .map((candidate) => {
        // ✅ match skills smartly
        const matchedSkills = candidate.skills.filter((skill) =>
          requiredSkills.some((req) =>
            skill.toLowerCase().includes(req.toLowerCase())
          )
        );

        // ✅ scoring
        const score =
          matchedSkills.length * 10 +
          (candidate.experience || 0) * 2 +
          (candidate.projects || 0);

        return {
          candidateId: candidate._id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          experience: candidate.experience,
          projects: candidate.projects,
          matchedSkills,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // ✅ save to DB
    const saved = await Shortlisted.create({
      jobId,
      candidates: shortlisted,
    });

    return res.status(200).json({
      message: "✅ Shortlisting Successful",
      totalCandidates: shortlisted.length,
      shortlisted: saved,
    });
  } catch (error) {
    console.error("Shortlisting Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
