import resumeShortListQueue from '../../queues/resumeShortListQueue.js';
import CandidateModel from '../../models/candidateModel.js';
import ShortlistedCandidatesModel from '../../models/Resume Screening Models/ShortlistedCandidatesModel.js';
export const shortListController = async (req, res) => {
  try {
    const { jdId } = req.body;

    if (!jdId) {
      return res.status(400).json({ message: "jdId is required" });
    }

    await resumeShortListQueue.add('resumeShortlistQueue', { jdId });

    return res.status(200).json({ message: "Resume shortlisting in progress" });
  } catch (error) {
    console.error("Error in shortListController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCandidateController = async (req, res) => {
  try {
    // Logic to fetch all candidates from the database
    const { jdId } = req.params;
console.log(jdId);
    const candidates = await CandidateModel.find({job_id:jdId}); // Assuming CandidateModel is defined and imported  
    return res.status(200).json({ candidates });
  } catch (error) {
    console.error("Error in getAllCandidateController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllShortlistedController = async (req, res) => {
  try {
    // Logic to fetch all candidates from the database
    const { jdId } = req.params;
    console.log(jdId);
    const candidates = await ShortlistedCandidatesModel.find({jobId:jdId}).populate("candidateId"); // Assuming CandidateModel is defined and imported  
    return res.status(200).json({ candidates });
  } catch (error) {
    console.error("Error in getAllCandidateController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
