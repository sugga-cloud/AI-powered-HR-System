import axiosClient from './axiosClient';
import { CreateOfferRequest, CreateOnboardingTaskRequest, Offer, OnboardingTask } from '@/types/offer';

export const offerApi = {
  create: async (data: CreateOfferRequest): Promise<{ success: boolean; message: string; offer: Offer }> => {
    const response = await axiosClient.post('/oo/create', data);
    // Backend returns: { success, message, offer }
    return response.data;
  },

  list: async (): Promise<{ success: boolean; offers: Offer[] }> => {
    const response = await axiosClient.get('/oo/list');
    // Backend returns: { success, offers }
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; offer: Offer }> => {
    const response = await axiosClient.get(`/oo/${id}`);
    // Backend returns: { success, offer }
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<{ success: boolean; message: string; offer: Offer }> => {
    const response = await axiosClient.put(`/oo/status/${id}`, { status });
    // Backend returns: { success, message, offer }
    return response.data;
  },

  resend: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post(`/oo/resend/${id}`);
    // Backend returns: { success, message }
    return response.data;
  },

  createOnboardingTask: async (data: CreateOnboardingTaskRequest): Promise<{ success: boolean; message: string; task: OnboardingTask }> => {
    const response = await axiosClient.post('/oo/onboarding/create', data);
    // Backend returns: { success, message, task }
    return response.data;
  },

  getOnboardingTasks: async (candidate_id: string): Promise<{ success: boolean; tasks: OnboardingTask[] }> => {
    const response = await axiosClient.get(`/oo/onboarding/${candidate_id}`);
    // Backend returns: { success, tasks }
    return response.data;
  },
};
