import Queue from "bull";
import jdPostWorker from "../services/jdPostService.js";
import dotenv from "dotenv";
dotenv.config();

// Redis connection
const JDPostQueue = new Queue("jd-post-queue", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
  },
});

// Worker
JDPostQueue.process(async (job) => {
  const { jdId } = job.data;
  try {
    console.log(`Processing JD post job for: ${jdId}`);
    const results = await jdPostWorker(jdId);
    return results;
  } catch (err) {
    console.error(`JD post job failed for ${jdId}:`, err.message);
    throw err;
  }
});

// Event listeners
JDPostQueue.on("completed", (job, result) => {
  console.log(`JD post job ${job.id} completed`);
});

JDPostQueue.on("failed", (job, err) => {
  console.log(`JD post job ${job.id} failed:`, err.message);
});

export default JDPostQueue;
