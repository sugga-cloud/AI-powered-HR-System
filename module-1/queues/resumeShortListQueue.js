import Queue from 'bull';
import shortListedCandidatesForJD from '../services/aiResumeShortListService.js';

const redis = {
  port: process.env.REDIS_PORT || 17487,
  host: process.env.REDIS_HOST || "redis-17487.crce217.ap-south-1-1.ec2.redns.redis-cloud.com",
  password: process.env.REDIS_PASSWORD || "PUPIU547h1BiS2MWjaym3nBSzaxmyry6",
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