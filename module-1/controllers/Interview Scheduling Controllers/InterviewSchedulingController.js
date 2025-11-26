import InterviewSchedule from "../../models/Interview Scheduling Models/InterviewSchedulingModels.js";
import ShortlistedCandidatesModel from "../../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import userModel from "../../models/Util Models/userModel.js";
import { generateMeetingLink } from "../../services/calendarService.js";
import axios from "axios";

export const createInterviewController = async (req, res) => {
    try {
        const {
            candidate_id,
            job_id,
            interviewer_ids,
            // round,
            // candidateAvailability,
            // interviewerAvailability,
            mode,
        } = req.body;

        // Fetch candidates shortlisted by AI analysis
        const shortlistedCandidate = await ShortlistedCandidatesModel.findOne({
            candidateId: candidate_id,
            jobId: job_id,
        });

        // AI finds best slot
        // const bestSlot = await suggestBestSlot(candidateAvailability, interviewerAvailability);
        const meeting_link = await generateMeetingLink({ mode });

        const interview = await InterviewSchedule.create({
            candidate_id,
            job_id,
            interviewer_ids,
            // round,
            // scheduled_time: bestSlot,
            mode,
            meeting_link,
        });

        // Notify candidate & interviewers
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
            to: `${shortlistedCandidate.email}@gmail.com`,
            subject: "Interview Scheduled",
            html: `<p>Your interview has been scheduled.<br>Meeting Link: <a href="${meeting_link}">${meeting_link}</a></p>`,
        });

        res.status(201).json({
            success: true,
            message: "Interview scheduled successfully",
            interview,
        });
    } catch (error) {
        console.error("Interview Creation Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getInterviewsController = async (req, res) => {
    try {
        const { user_id, role } = req.query; // role can be 'candidate' or 'interviewer'
        let interviews;
        if (role === "candidate") {
            interviews = await InterviewSchedule
                .find({ candidate_id: user_id })
                .populate("interviewer_ids", "name email")
                .populate("candidate_id", "name email");
        } else if (role === "interviewer") {
            interviews = await InterviewSchedule
                .find({ interviewer_ids: user_id })
                .populate("interviewer_ids", "name email")
                .populate("candidate_id", "name email");
        } else {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }
        res.status(200).json({ success: true, interviews });
    } catch (error) {
        console.error("Get Interviews Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateInterviewStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // expected values: 'completed', 'cancelled', etc.
        const interview = await InterviewSchedule.findByIdAndUpdate(
            id,
            {
                status,
            },
            { new: true }
        );
        if (!interview) {
            return res.status(404).json({ success: false, message: "Interview not found" });
        }
        res.status(200).json({
            success: true,
            message: "Interview status updated successfully",
            interview,
        });
    } catch (error) {
        console.error("Update Interview Status Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const addFeedbackController = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const interview = await InterviewSchedule.findByIdAndUpdate(
            id,
            { feedback },
            { new: true }
        );
        if (!interview) {
            return res.status(404).json({ success: false, message: "Interview not found" });
        }
        res.status(200).json({
            success: true,
            message: "Feedback added successfully",
            interview,
        });
    } catch (error) {
        console.error("Add Feedback Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
