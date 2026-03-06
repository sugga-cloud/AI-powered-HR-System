import Queue from 'bull';
import shortListedCandidatesForJD, {processAppliedCandidatesForJD} from '../services/aiResumeShortListService.js';
import redisClient from '../config/redisClient.js';

const resumeQueue = new Queue('resumeShortlistQueue', {
  redis: redisClient,
});
  

resumeQueue.process('resumeShortlistQueue', async (job) => {
  const { jdId } = job.data;
  const result = await shortListedCandidatesForJD(jdId);
  console.log(`Resume shortlisting completed for JD ID: ${jdId} status: ${result.message}`);
});

resumeQueue.process('resumeExtractQueue', async (job) => {
  const { jdId } = job.data;
  const result = await processAppliedCandidatesForJD(jdId);
  console.log(`Resume extraction completed for JD ID: ${jdId} status: ${result.message}`);
});

export default resumeQueue;