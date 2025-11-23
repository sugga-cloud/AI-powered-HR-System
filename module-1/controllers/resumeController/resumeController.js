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
    let candidates;
    if(!jdId || jdId==='all')
       candidates = await CandidateModel.find(); // Assuming CandidateModel is defined and imported  
    else candidates = await CandidateModel.find({job_id:jdId}); // Assuming CandidateModel is defined and imported  
    console.log(jdId);
    return res.status(200).json({ candidates });
  } catch (error) {
    console.error("Error in getAllCandidateController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllShortlistedController = async (req, res) => {
  try {
    const { jdId } = req.params;
    console.log("jdId:", jdId);

    let candidates;

    if (!jdId || jdId === "all") {
      // Return ALL shortlisted candidates
      candidates = await ShortlistedCandidatesModel
        .find()
        .populate("candidateId");
    } else {
      // Return shortlisted candidates for a specific job
      candidates = await ShortlistedCandidatesModel
        .find({ jobId: jdId })
        .populate("candidateId");
    }

    return res.status(200).json({ candidates });
  } catch (error) {
    console.error("Error in getAllShortlistedController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
