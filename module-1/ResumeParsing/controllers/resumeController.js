// controllers/resumeController.js
import Candidate from "../models/Candidate.js";
import { parseResumeBuffer } from "../services/resumeParsingService.js";

export const uploadResumes = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const savedCandidates = [];

    for (const file of req.files) {
      const parsed = await parseResumeBuffer(file);
      if (parsed.error) continue;

      const saved = await Candidate.create({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        skills: parsed.skills,
        experience: parsed.experience,
        projects: parsed.projects,
        educationLevel: parsed.educationLevel,
        atsScore: parsed.atsScore,
        rawText: parsed.rawText
      });

      savedCandidates.push(saved);
    }

    res.json({
      message: "Resumes uploaded & parsed successfully",
      count: savedCandidates.length,
      savedCandidates
    });

  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};
