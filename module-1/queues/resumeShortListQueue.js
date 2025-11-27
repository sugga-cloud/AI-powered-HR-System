import Queue from 'bull';
import shortListedCandidatesForJD from '../services/aiResumeShortListService.js';

const redis = {
  port: process.env.REDIS_PORT || 18379,
  host: process.env.REDIS_HOST || "redis-18379.c326.us-east-1-3.ec2.cloud.redislabs.com",
  password: process.env.REDIS_PASSWORD || "sXcQ6UXWVwZplw7oCswvNesMGmb5jXM6",
  username: process.env.REDIS_USERNAME || "default",
};

const resumeShortlistQueue = new Queue('resumeShortlistQueue', {
  redis,
});

resumeShortlistQueue.process('resumeShortlistQueue', async (job) => {
  const { jdId } = job.data;
  const result = await shortListedCandidatesForJD(jdId);
  console.log(`Resume shortlisting completed for JD ID: ${jdId} status: ${result.message}`);
});

export default resumeShortlistQueue;