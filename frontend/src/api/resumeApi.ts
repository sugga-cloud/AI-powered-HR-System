import axiosClient from "./axiosClient";
import {
  Candidate,
  ShortlistRequest,
  ShortlistedCandidate,
} from "@/types/candidate";

export const resumeApi = {
  shortlist: async (data: ShortlistRequest): Promise<void> => {
    const response = await axiosClient.post("/rs/shortlist", data);
    return response.data;
  },

  getAllCandidates: async (jdId?: string): Promise<Candidate[]> => {
    const url = jdId ? `/rs/getAllCandidates/${jdId}` : "/rs/getAllCandidates/all";
    const response = await axiosClient.get(url);
    return response.data.candidates || response.data;
  },

  getShortlistedCandidates: async (
    jdId?: string
  ): Promise<ShortlistedCandidate[]> => {
    const url = jdId
      ? `/rs/getAllShortListedCandidates/${jdId}`
      : "/rs/getAllShortListedCandidates";
    const response = await axiosClient.get(url);
    // Backend returns: { candidates: Array }
    return response.data.candidates || response.data;
  },
};
