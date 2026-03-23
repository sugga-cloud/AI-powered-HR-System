import CandidateApplied from '../../models/CandidateAppliedModel.js';
import resumeQueue from '../../queues/resumeShortListQueue.js';
export const applyToJob = async (req, res) => {
  try {
    const { job_id } = req.body;
    console.log(`Received application for JD ID: ${job_id} with file: ${req.file ? req.file.path : 'No file uploaded'}`);
    // Check if file exists (Multer puts file data in req.file)
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const newApplication = new CandidateApplied({
      resume: req.file.path, // This is the URL/path from your storage (S3, Cloudinary, or Local)
      job_id: job_id
    });

    await newApplication.save();
    resumeQueue.add('resumeExtractQueue', { jdId: job_id });
    res.status(201).json({ 
      success: true, 
      message: "Application submitted successfully!",
      data: newApplication 
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};