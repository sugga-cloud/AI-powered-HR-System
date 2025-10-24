import Queue from "bull";
import CandidateTest from "../models/Candidate Assessment Models/CandidateTestModel.js";
import { generateAITest } from "../services/testAIService.js"; // your AI test generation function
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
TestQueue.on("completed", (job) => {
    console.log(`✅ Test Job ${job.id} completed successfully.`);
});

TestQueue.on("failed", (job, err) => {
    console.error(`❌ Test Job ${job.id} failed: ${err.message}`);
});

console.log("🧩 Test Worker is running...");
export default TestQueue;
