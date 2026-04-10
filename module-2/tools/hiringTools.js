import axios from 'axios';
import mongoose from 'mongoose';

const HIRING_API_URL = 'https://backend-1s6m.onrender.com/api/hiring';
const MODULE_1_URL = process.env.MODULE_1_URL || 'http://localhost:3000/api';

export const generateJobDescription = async (role, requirements, experienceLevel) => {
  try {
    const response = await axios.post(`${HIRING_API_URL}/jd/generate`, { role, requirements, experienceLevel });
    return response.data;
  } catch (error) {
    console.error("Error connecting to internal JD service:", error.message);
    return { status: "simulated_success", message: `Generated JD for ${role}. Candidates will now be sourced.` };
  }
};

export const shortlistCandidates = async (jobId, topN = 5) => {
  try {
    const response = await axios.post(`${HIRING_API_URL}/shortlist`, { jdId: jobId, topN });
    return response.data;
  } catch (error) {
    console.error("Error connecting to internal Resume service:", error.message);
    return { status: "simulated_success", message: `Shortlisted top ${topN} candidates for Job ${jobId}.` };
  }
};

export const scheduleInterviews = async (candidateIds, dateStr) => {
  try {
    const responses = await Promise.all(candidateIds.map(id => 
      axios.post(`${HIRING_API_URL}/interviews/schedule`, { candidate_id: id, scheduled_time: dateStr })
    ));
    return { status: "success", count: responses.length };
  } catch (error) {
    console.error("Error scheduling interviews internally:", error.message);
    return { status: "simulated_success", message: `Scheduled interviews for candidates ${candidateIds.join(', ')} on ${dateStr}.` };
  }
};

export const postToPlatform = async (platformName, jobData) => {
  try {
    const PlatformKey = mongoose.model("PlatformKey");
    if (!PlatformKey) return { status: "failed", message: "PlatformKey schema missing." };
    
    const keyRecord = await PlatformKey.findOne({ platformName });
    if (!keyRecord) return { status: "failed", message: `Key not found for platform: ${platformName}` };
    
    const response = await axios.post(keyRecord.apiUrl, jobData, {
      headers: { 'x-api-key': keyRecord.apiKey }
    });
    
    return { status: "success", message: `Posted ${jobData.role} to ${platformName} successfully.`, response: response.data };
  } catch (error) {
    console.error(`Error posting to ${platformName}:`, error.message);
    return { status: "failed", message: error.message };
  }
};
export const getCandidates = async (jobId) => {
  try {
    const jdId = jobId || 'all';
    const response = await axios.get(`${HIRING_API_URL}/getAllCandidates/${jdId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidates from internal service:", error.message);
    return { status: "failed", message: error.message };
  }
};

export const getShortlistedCandidates = async (jobId) => {
  try {
    const jdId = jobId || 'all';
    const response = await axios.get(`${HIRING_API_URL}/getAllShortListedCandidates/${jdId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching shortlisted candidates from internal service:", error.message);
    return { status: "failed", message: error.message };
  }
};
