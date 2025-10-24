import CandidateTest from "../../models/Candidate Assessment Models/CandidateTestModel.js";
import CandidateScore from "../../models/Candidate Assessment Models/CandidateScoreModel.js";
import { sendNotification } from "../../../Utils/MailService"; // optional utility
import { aiEvaluateTest } from "../../../Utils/AI/"; // ML/AI service (later)
import TestQueue from "../../queues/testQueue.js"; // Bull queue for async processing

/**
 * @desc Initialize test for candidate (create test entry, generate credentials)
 * @route POST /api/candidate-assessment/init
 */

export const caInitController = async (req, res) => {
    try {
        const { candidate_id, job_id, role, skills, test_type = "MCQ" } = req.body;

        // 1️⃣ Create a base CandidateTest document (status: initiated)
        const newTest = await CandidateTest.create({
            candidate_id,
            job_id,
            test_type,
            test_status: "initiated",
            total_marks: 0,
            obtained_marks: 0,
            questions: [],
        });

        // 2️⃣ Generate the AI prompt dynamically
        const prompt = `Generate a ${test_type} assessment for the ${role} role.
Include questions covering ${skills.join(", ")}.
Each question should be clear, professional, and have 4 options with one correct answer.`;

        // 3️⃣ Add this job to Bull Queue for async AI test generation
        await TestQueue.add({
            testId: newTest._id,
            prompt,
            userId: candidate_id,
        });

        // 4️⃣ Notify candidate (optional)
        await sendNotification(candidate_id, "Your test is being prepared by the AI system. You’ll be notified once it’s ready.");

        // 5️⃣ Send response back immediately
        res.status(201).json({
            success: true,
            message: "AI test generation started successfully",
            test_id: newTest._id,
            status: "initiated",
        });
    } catch (error) {
        console.error("❌ Init Test Error:", error);
        res.status(500).json({ success: false, message: "Failed to initialize test" });
    }
};

/**
 * @desc Fetch test details for candidate
 * @route GET /api/candidate-assessment/test
 */
export const caGetTestController = async (req, res) => {
    try {
        const { candidate_id } = req.query;

        const test = await CandidateTest.findOne({
            candidate_id,
            test_status: { $in: ["pending", "in_progress"] },
        });

        if (!test)
            return res
                .status(404)
                .json({ success: false, message: "No test found for candidate" });

        res.status(200).json({ success: true, test });
    } catch (error) {
        console.error("Get Test Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @desc Submit test & evaluate score (via AI + rule-based logic)
 * @route POST /api/candidate-assessment/submit
 */
export const caSubmitTestController = async (req, res) => {
    try {
        const { test_id, responses } = req.body;

        const test = await CandidateTest.findById(test_id);
        if (!test)
            return res
                .status(404)
                .json({ success: false, message: "Test not found" });

        // Mark selected answers and calculate raw score
        let obtained = 0;
        test.questions = test.questions.map((q) => {
            const response = responses.find((r) => r.question_id === q.question_id);
            if (response) {
                q.selected_answer = response.answer;
                q.is_correct = q.correct_answer === response.answer;
                if (q.is_correct) obtained += q.marks;
            }
            return q;
        });
        test.obtained_marks = obtained;
        test.test_status = "completed";
        test.completed_at = new Date();
        await test.save();

        // Call AI evaluation microservice for deeper insights
        const aiResult = await aiEvaluateTest(test._id);

        // Save candidate score document
        const scoreDoc = await CandidateScore.create({
            candidate_id: test.candidate_id,
            job_id: test.job_id,
            test_id: test._id,
            total_score: obtained,
            percentage: (obtained / test.total_marks) * 100,
            ai_analysis: aiResult,
        });

        res.status(200).json({
            success: true,
            message: "Test submitted & evaluated successfully",
            score: scoreDoc,
        });
    } catch (error) {
        console.error("Submit Test Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @desc Fetch shortlisted candidates (based on AI score threshold)
 * @route GET /api/candidate-assessment/shortlisted
 */
export const caShortlistedController = async (req, res) => {
    try {
        const shortlisted = await CandidateScore.find({
            "ai_analysis.final_recommendation": { $in: ["yes", "strong_yes"] },
        }).populate("candidate_id job_id");

        res.status(200).json({
            success: true,
            total: shortlisted.length,
            shortlisted,
        });
    } catch (error) {
        console.error("Shortlisted Fetch Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
