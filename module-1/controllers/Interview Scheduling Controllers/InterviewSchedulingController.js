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
            interviewer_ids = [], // Default to empty array if not provided
            mode,
            batch = false, // NEW: Add batch flag to schedule for all shortlisted candidates
        } = req.body;

        console.log("📥 Interview Create Request:", {
            candidate_id,
            job_id,
            batch,
            mode,
            interviewer_ids_count: interviewer_ids?.length || 0,
        });

        // Validate required fields
        if (!job_id) {
            console.warn("⚠️ Missing job_id in request");
            return res.status(400).json({
                success: false,
                message: "job_id is required",
            });
        }

        if (!mode) {
            console.warn("⚠️ Missing mode in request");
            return res.status(400).json({
                success: false,
                message: "mode is required",
            });
        }

        // Validate and clean interviewer_ids - filter out invalid entries
        let validInterviewerIds = [];
        if (Array.isArray(interviewer_ids)) {
            for (const id of interviewer_ids) {
                // Check if it's a valid MongoDB ObjectId format
                if (id && /^[0-9a-f]{24}$/i.test(id.toString())) {
                    validInterviewerIds.push(id);
                } else {
                    console.warn("⚠️ Invalid interviewer ID format, skipping:", id);
                }
            }
        }

        // If batch mode, schedule for all shortlisted candidates
        if (batch) {
            console.log("🔄 Batch mode: Scheduling for all shortlisted candidates");
            
            // Import CandidateScore model to get CA shortlisted candidates
            const CandidateScoreModel = await import("../../models/Candidate Assessment Models/CandidateScoreModel.js").then(m => m.default);

            // Fetch candidates who passed assessment (shortlisted by CA)
            const passedCandidates = await CandidateScoreModel.find({
                job_id,
                "ai_analysis.final_recommendation": { $in: ["yes", "strong_yes", "neutral"] },
            }).populate("candidate_id");

            console.log(`📊 Found ${passedCandidates.length} shortlisted candidates for batch scheduling`);

            if (passedCandidates.length === 0) {
                console.warn("⚠️ No shortlisted candidates found for job:", job_id);
                return res.status(200).json({
                    success: true,
                    message: "No shortlisted candidates found for this job",
                    scheduled_count: 0,
                    failed_count: 0,
                    total_candidates: 0,
                    results: [],
                });
            }

            let scheduledCount = 0;
            let failedCount = 0;
            const results = [];

            // Schedule interview for each candidate
            for (const candidateScore of passedCandidates) {
                try {
                    const cand_id = candidateScore.candidate_id._id;
                    const candidateName = candidateScore.candidate_id.name || "Candidate";
                    const candidateEmail = candidateScore.candidate_id.email;

                    // Generate meeting link and create interview
                    const meeting_link = await generateMeetingLink({ mode });
                    const interview = await InterviewSchedule.create({
                        candidate_id: cand_id,
                        job_id,
                        interviewer_ids: validInterviewerIds, // Use validated IDs
                        mode,
                        meeting_link,
                    });

                    // Send notification email
                    try {
                        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
                            to: candidateEmail,
                            subject: "Interview Scheduled",
                            html: `<p>Your interview has been scheduled.<br>Meeting Link: <a href="${meeting_link}">${meeting_link}</a></p>`,
                        });
                        console.log("📧 Email sent to:", candidateEmail);
                    } catch (emailError) {
                        console.warn("⚠️ Email send failed:", emailError.message);
                    }

                    scheduledCount++;
                    results.push({
                        candidate_id: cand_id,
                        candidate_name: candidateName,
                        interview_id: interview._id,
                        status: "scheduled",
                    });

                    console.log("✅ Interview scheduled for:", candidateName);
                } catch (error) {
                    failedCount++;
                    console.warn("⚠️ Failed to schedule interview for candidate:", error.message);
                    results.push({
                        status: "failed",
                        error: error.message,
                    });
                }
            }

            return res.status(201).json({
                success: true,
                message: `Scheduled ${scheduledCount} interview(s)`,
                scheduled_count: scheduledCount,
                failed_count: failedCount,
                total_candidates: passedCandidates.length,
                results,
            });
        }

        // SINGLE CANDIDATE MODE
        console.log("👤 Single candidate mode: Scheduling for candidate:", candidate_id);
        
        if (!candidate_id) {
            console.warn("⚠️ Missing candidate_id in single mode");
            return res.status(400).json({
                success: false,
                message: "candidate_id is required for single candidate scheduling",
            });
        }

        // Fetch candidate from Candidate model
        const CandidateModel = await import("../../models/candidateModel.js").then(m => m.default);
        const candidate = await CandidateModel.findById(candidate_id);

        if (!candidate) {
            console.warn("⚠️ Candidate not found:", candidate_id);
            return res.status(404).json({
                success: false,
                message: "Candidate not found",
            });
        }

        const meeting_link = await generateMeetingLink({ mode });

        const interview = await InterviewSchedule.create({
            candidate_id,
            job_id,
            interviewer_ids: validInterviewerIds, // Use validated IDs
            mode,
            meeting_link,
        });

        // Notify candidate
        try {
            await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
                to: candidate.email,
                subject: "Interview Scheduled",
                html: `<p>Dear ${candidate.name},<br><br>Your interview has been scheduled.<br>Meeting Link: <a href="${meeting_link}">${meeting_link}</a><br><br>Best regards,<br>HR Team</p>`,
            });
            console.log("📧 Email sent to:", candidate.email);
        } catch (emailError) {
            console.warn("⚠️ Email send failed:", emailError.message);
        }

        res.status(201).json({
            success: true,
            message: "Interview scheduled successfully",
            interview,
        });
    } catch (error) {
        console.error("❌ Interview Creation Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Server error",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
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
