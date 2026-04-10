import InterviewSchedule from '../models/Interview Scheduling Models/InterviewSchedulingModels.js';

export const scheduleInterview = async (req, res) => {
  try {
    const { candidate_id, job_id, scheduled_time, round, mode, interviewer_ids } = req.body;
    
    const newSchedule = new InterviewSchedule({
      candidate_id,
      job_id,
      scheduled_time,
      round: round || "technical",
      mode: mode || "online",
      interviewer_ids: interviewer_ids || []
    });

    await newSchedule.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Interview scheduled successfully!",
      data: newSchedule 
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getInterviews = async (req, res) => {
  try {
    const { jobId } = req.params;
    let interviews;
    if (!jobId || jobId === 'all') {
      interviews = await InterviewSchedule.find().populate('candidate_id job_id');
    } else {
      interviews = await InterviewSchedule.find({ job_id: jobId }).populate('candidate_id job_id');
    }
    res.status(200).json({ success: true, data: interviews });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const interview = await InterviewSchedule.findByIdAndUpdate(id, { status }, { new: true }).populate('candidate_id job_id');
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    res.status(200).json({ success: true, message: "Status updated", data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitInterviewFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, score } = req.body;
    const interview = await InterviewSchedule.findByIdAndUpdate(id, { feedback, score, status: "completed" }, { new: true }).populate('candidate_id job_id');
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    res.status(200).json({ success: true, message: "Feedback recorded", data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
