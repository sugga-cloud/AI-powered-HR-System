import axiosClient from "./axiosClient";
import {
  CreateJDRequest,
  JobDescription,
  PostJDRequest,
  UpdateJDRequest,
} from "@/types/jd";

export const jdApi = {
  create: async (data: CreateJDRequest): Promise<JobDescription> => {
    const response = await axiosClient.post("/jd/create", data);
    return response.data;
  },

  getAll: async (): Promise<JobDescription[]> => {
    const response = await axiosClient.get("/jd/getAll");
    // Backend returns {count: number, jds: Array}
    return response.data.jds || response.data;
  },

  getById: async (id: string): Promise<JobDescription> => {
    const response = await axiosClient.get(`/jd/get/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateJDRequest
  ): Promise<JobDescription> => {
    const response = await axiosClient.post("/jd/update", { jdId: id, ...data });
    console.log("JD updated:", response.data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.post("/jd/delete", { jdId: id });
  },

  createPost: async (id: string, data: PostJDRequest): Promise<void> => {
    await axiosClient.post("/jd/createPost", { id, ...data });
  },
};
