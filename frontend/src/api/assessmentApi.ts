import axiosClient from './axiosClient';
import { Assessment, AssessmentInit, CandidateScore, ShortlistedCandidate, SubmitAssessmentRequest } from '@/types/assessment';

export const assessmentApi = {
  init: async (data: AssessmentInit): Promise<{ success: boolean; message: string; test_id: string; status: string }> => {
    const response = await axiosClient.post('/ca/init', data);
    // Backend returns: { success, message, test_id, status }
    return response.data;
  },

  getTest: async (candidate_id: string): Promise<{ success: boolean; test: Assessment }> => {
    const response = await axiosClient.get('/ca/test', { params: { candidate_id } });
    // Backend returns: { success, test }
    return response.data;
  },

  getTestByTestId: async (test_id: string): Promise<{ success: boolean; test: Assessment }> => {
    const response = await axiosClient.get(`/ca/test/${test_id}`);
    // Backend returns: { success, test }
    return response.data;
  },

  submit: async (data: SubmitAssessmentRequest): Promise<{ success: boolean; message: string; score: CandidateScore }> => {
    const response = await axiosClient.post('/ca/submit', data);
    // Backend returns: { success, message, score }
    return response.data;
  },

  getShortlisted: async (): Promise<{ success: boolean; total: number; shortlisted: ShortlistedCandidate[] }> => {
    const response = await axiosClient.get('/ca/shortlisted');
    // Backend returns: { success, total, shortlisted }
    return response.data;
  },

  getAssessmentDetails: async (candidateScoreId: string): Promise<{ success: boolean; shortlisted: ShortlistedCandidate }> => {
    const response = await axiosClient.get(`/ca/shortlisted/${candidateScoreId}`);
    // Backend returns: { success, shortlisted }
    return response.data;
  },
};
