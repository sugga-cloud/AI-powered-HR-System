import Queue from "bull";
import CandidateTest from "../models/Candidate Assessment Models/CandidateTestModel.js";
import ShortlistedCandidatesModel from "../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import { generateAITest } from "../services/aiService.js"; // your AI test generation function
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const redis = {
    port: process.env.REDIS_PORT || 17487,
    host: process.env.REDIS_HOST || "redis-17487.crce217.ap-south-1-1.ec2.redns.redis-cloud.com",
    password: process.env.REDIS_PASSWORD || "PUPIU547h1BiS2MWjaym3nBSzaxmyry6",
    username: process.env.REDIS_USERNAME || "default",
};

// 🧠 Create a Bull queue for test generation
const TestQueue = new Queue("test-queue", { redis });

TestQueue.process(async (job) => {
    const { testId, prompt, userId, previousResponse } = job.data;

    try {
        console.log(`🎯 Processing AI Test for user: ${userId}, prompt: "${prompt}"`);

        // 1️⃣ Mark test as processing
        await CandidateTest.findByIdAndUpdate(testId, { test_status: "processing" });

        // 2️⃣ Generate test content via AI service
        const aiResponse = await generateAITest(prompt, previousResponse);

        // 3️⃣ Update CandidateTest document with AI response
        await CandidateTest.findByIdAndUpdate(
            testId,
            {
                test_status: "ai_generated",
                questions: aiResponse.questions || [],
                total_marks: aiResponse.totalMarks || 0,
                duration_minutes: aiResponse.durationMinutes || 30,
                aiMetadata: aiResponse.aiMetadata || {},
                updated_at: new Date(),
            },
            { new: true }
        );

        console.log(`✅ AI Test generation completed for jobId: ${job.id}`);
        return { testId, status: "completed" };
    } catch (err) {
        console.error(`❌ AI Test generation failed for jobId: ${job.id}`, err);

        await CandidateTest.findByIdAndUpdate(testId, { test_status: "failed" });
        throw err;
    }
});

// Optional logging for dev/debugging
TestQueue.on("completed", async (job) => {
    console.log(`✅ Test Job ${job.id} completed successfully.`);

    try {
        const { testId, userId } = job.data;

        // Fetch the completed test
        const completedTest = await CandidateTest.findById(testId);
        if (!completedTest) {
            console.warn("⚠️ Test not found for ID:", testId);
            return;
        }

        // Fetch candidate details from ShortlistedCandidates
        const shortlistedCandidate = await ShortlistedCandidatesModel.findOne({
            candidateId: userId,
        }).populate('candidateId');

        if (!shortlistedCandidate) {
            console.warn("⚠️ Shortlisted candidate not found for:", userId);
            return;
        }

        const candidateEmail = shortlistedCandidate.candidateId?.email || shortlistedCandidate.email;
        const candidateName = shortlistedCandidate.candidateId?.name || shortlistedCandidate.name;

        if (!candidateEmail) {
            console.warn("⚠️ Candidate email not found");
            return;
        }

        // Generate test access link (you can customize this URL)
        const testLink = `${process.env.FRONTEND_URL}/candidate/tests/${testId}`;

        // Prepare notification payload
        const notificationPayload = {
            to: candidateEmail,
            subject: "Your Assessment Test is Ready! 🎯",
            html: `Dear ${candidateName},<br/><br/>
Great news! Your assessment test has been successfully generated and is ready for you to take.<br/><br/>
<strong>Test Details:</strong><br/>
Total Questions: <strong>${completedTest.questions?.length || 0}</strong><br/>
Total Marks: <strong>${completedTest.total_marks}</strong><br/>
Duration: <strong>${completedTest.duration_minutes || 30} minutes</strong><br/>
Test Type: <strong>${completedTest.test_type}</strong><br/><br/>

<strong>How to Access Your Test:</strong><br/>
Click the link below to access your test portal:<br/>
<a href="${testLink}" style="color: #0b6efd; text-decoration: none;"><strong>Start Your Assessment</strong></a><br/><br/>

<strong>Your Login Credentials:</strong><br/>
<strong>Login ID:</strong> ${shortlistedCandidate.loginId}<br/>
<strong>Password:</strong> ${shortlistedCandidate.password}<br/><br/>

<strong>Important Notes:</strong><br/>
✓ Please complete the test within the given duration<br/>
✓ Save your answers regularly to avoid losing progress<br/>
✓ You will receive your results and feedback after submission<br/><br/>

If you have any issues accessing the test, please contact our HR team.<br/><br/>
Best regards,<br/>
HR Assessment Team`,
        };

        console.log("📧 Sending test completion notification to:", candidateEmail);
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, notificationPayload);
        console.log("✅ Test notification email sent successfully for candidate:", candidateName);
    } catch (emailError) {
        console.warn("⚠️ Failed to send test completion email:", emailError.message);
        // Don't throw error, just warn
    }
});

TestQueue.on("failed", (job, err) => {
    console.error(`❌ Test Job ${job.id} failed: ${err.message}`);
});

console.log("🧩 Test Worker is running...");
export default TestQueue;
