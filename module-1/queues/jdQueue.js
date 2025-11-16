import Queue from "bull";
import JD from "../models/jdModel.js";
import { generateAIJD } from "../services/aiService.js";
import dotenv from "dotenv";
dotenv.config();

const redis = {
  port: process.env.REDIS_PORT || 17487,
  host: process.env.REDIS_HOST || "redis-17487.crce217.ap-south-1-1.ec2.redns.redis-cloud.com",
  password: process.env.REDIS_PASSWORD || "PUPIU547h1BiS2MWjaym3nBSzaxmyry6",
  username: process.env.REDIS_USERNAME || "default",
};

const JDQueue = new Queue("jd-queue", { redis });

JDQueue.process(async (job) => {
  const { jdId, prompt, userId, previousResponse } = job.data;
  console.log(previousResponse)

  try {
    console.log(`Processing JD for user: ${userId}, prompt: "${prompt}"`);

    // 1️⃣ Mark JD as processing
    await JD.findByIdAndUpdate(jdId, { status: "processing" });

    // 2️⃣ Generate or refine JD using AI
    const aiResponse = await generateAIJD(prompt, previousResponse);

    // 3️⃣ Save AI result
    await JD.findByIdAndUpdate(
      jdId,
      { aiResponse, status: "completed", updatedAt: new Date() },
      { new: true }
    );

    console.log(`JD generation completed for jobId: ${job.id}`);
    return { jdId, status: "completed" };
  } catch (err) {
    console.error(`JD generation failed for jobId: ${job.id}`, err);

    await JD.findByIdAndUpdate(jdId, { status: "failed" });
    throw err;
  }
});

// Logging for debugging
JDQueue.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully.`);
});

JDQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed: ${err.message}`);
});

console.log("JD Worker is running...");
export default JDQueue;
