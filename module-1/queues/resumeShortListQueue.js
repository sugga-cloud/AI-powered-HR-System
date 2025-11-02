import Queue from 'bull';
import { REDIS_CONFIG } from '../../config/redisConfig.js';
import shortListedCandidatesForJD from '../services/aiResumeShortListService.js';
const resumeShortlistQueue = new Queue('resumeShortlistQueue', {
  redis: REDIS_CONFIG,
});

resumeShortlistQueue.process(async (job) => {
  const { jdId } = job.data;
  const result = await shortListedCandidatesForJD(jdId);
  console.log(`Resume shortlisting completed for JD ID: ${jdId} status: ${result.message}`);
});

export default resumeShortlistQueue;