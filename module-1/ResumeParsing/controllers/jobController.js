import Job from "../models/Job.js";

export const createJob = async (req, res) => {
  try {
    const { title, requiredSkills, minExperience, minProjects } = req.body;

    const job = await Job.create({
      title,
      requiredSkills: requiredSkills || [],
      minExperience: minExperience || 0,
      minProjects: minProjects || 0
    });

    res.status(200).json({
      message: "Job saved successfully",
      job
    });
  } catch (error) {
    console.error("Job Creation Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
