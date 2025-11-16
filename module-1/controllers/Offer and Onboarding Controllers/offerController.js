import Offer from "../../models/Offer and Onboarding/Offer.js";
import OnboardingTask from "../../models/Offer and Onboarding/OnboardingTask.js";
import { generateAIOfferLetter } from "../../services/aiOfferService.js";
import { getSalaryBenchmark } from "../../services/salaryBenchmarkService.js";
import axios from "axios";

/**
 * @desc Create a new offer (AI + Salary Benchmark + Email Notification)
 */
export const createOfferController = async (req, res) => {
    try {
        const { candidate_id, job_id, baseSalary, positionTitle, candidate_email } = req.body;

        // 1️⃣ Salary benchmarking
        const benchmark = await getSalaryBenchmark(positionTitle, baseSalary);

        // 2️⃣ Generate offer letter using AI
        const offerText = await generateAIOfferLetter({
            candidate_id,
            positionTitle,
            salary: baseSalary,
        });

        // 3️⃣ Create offer record
        const offer = await Offer.create({
            candidate_id,
            job_id,
            salary_offered: {
                amount: baseSalary,
                currency: "INR",
                benchmark_position: benchmark.percentile,
            },
            offer_letter_text: offerText,
            status: "approved",
            signature_link: `https://hrsystem.ai/offers/${candidate_id}/sign`,
            sent_at: new Date(),
        });

        // 4️⃣ Send email notification
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notification/send`, {
            to: candidate_email,
            subject: "🎉 Your Job Offer from AI HR System",
            html: `
        <h2>Congratulations!</h2>
        <p>We’re thrilled to offer you the role of <strong>${positionTitle}</strong> at our organization.</p>
        <p>Your offered salary is <strong>₹${baseSalary.toLocaleString()} per annum</strong>.</p>
        <p>Please click below to review and accept your offer:</p>
        <a href="${offer.signature_link}" style="background:#0b6efd;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">View Offer Letter</a>
        <br/><br/>
        <p>We’re excited to have you onboard soon!<br/>— HR Team</p>
      `,
        });

        res.status(201).json({
            success: true,
            message: "Offer created and email sent successfully",
            offer,
        });
    } catch (error) {
        console.error("Offer Creation Error:", error);
        res.status(500).json({ success: false, message: "Failed to create offer" });
    }
};

/**
 * @desc Get all offers (for HR/Admin dashboard)
 */
export const getOffersController = async (req, res) => {
    try {
        const offers = await Offer.find()
            .populate("candidate_id", "name email")
            .populate("job_id", "title department")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, offers });
    } catch (error) {
        console.error("Get Offers Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch offers" });
    }
};

/**
 * @desc Get single offer details by ID
 */
export const getOfferByIdController = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id)
            .populate("candidate_id", "name email")
            .populate("job_id", "title department");

        if (!offer)
            return res.status(404).json({ success: false, message: "Offer not found" });

        res.status(200).json({ success: true, offer });
    } catch (error) {
        console.error("Get Offer Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch offer" });
    }
};

/**
 * @desc Update offer status (approve, reject, accept, etc.)
 */
export const updateOfferStatusController = async (req, res) => {
    try {
        const { status } = req.body;
        const offer = await Offer.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!offer)
            return res.status(404).json({ success: false, message: "Offer not found" });

        res.status(200).json({ success: true, message: "Offer status updated", offer });
    } catch (error) {
        console.error("Update Offer Status Error:", error);
        res.status(500).json({ success: false, message: "Failed to update offer" });
    }
};

/**
 * @desc Resend offer email manually (in case candidate didn't receive it)
 */
export const resendOfferEmailController = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate("candidate_id");

        if (!offer)
            return res.status(404).json({ success: false, message: "Offer not found" });

        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notification/send`, {
            to: offer.candidate_id.email,
            subject: "📩 Reminder: Your Job Offer Awaits!",
            html: `
        <p>Hello ${offer.candidate_id.name},</p>
        <p>This is a gentle reminder to review and accept your offer for the role you were selected for.</p>
        <p>Please click below to view and respond:</p>
        <a href="${offer.signature_link}" style="background:#198754;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">View Offer Letter</a>
        <br/><br/>
        <p>Thank you,<br/>HR Team</p>
      `,
        });

        res.status(200).json({ success: true, message: "Offer email resent successfully" });
    } catch (error) {
        console.error("Resend Offer Email Error:", error);
        res.status(500).json({ success: false, message: "Failed to resend offer email" });
    }
};

/**
 * @desc Create onboarding task after offer acceptance
 */
export const createOnboardingTaskController = async (req, res) => {
    try {
        const { candidate_id, offer_id, task_title, task_description, due_date } = req.body;

        const newTask = await OnboardingTask.create({
            candidate_id,
            offer_id,
            task_title,
            task_description,
            due_date,
        });

        res.status(201).json({
            success: true,
            message: "Onboarding task created successfully",
            task: newTask,
        });
    } catch (error) {
        console.error("Create Onboarding Task Error:", error);
        res.status(500).json({ success: false, message: "Failed to create onboarding task" });
    }
};

/**
 * @desc Get all onboarding tasks for a candidate
 */
export const getOnboardingTasksController = async (req, res) => {
    try {
        const { candidate_id } = req.params;
        const tasks = await OnboardingTask.find({ candidate_id }).sort({ due_date: 1 });

        res.status(200).json({ success: true, tasks });
    } catch (error) {
        console.error("Get Onboarding Tasks Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch onboarding tasks" });
    }
};
