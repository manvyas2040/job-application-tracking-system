import { api } from './client';

export type Job = {
  job_id: number;
  job_titel: string;
  job_description: string;
  department?: string;
  job_status: string;
};

export const getJobById = async (jobId: number) => {
  const { data } = await api.get(`/jobs/${jobId}`);
  return data as Job;
};

export const applyToJob = async (jobId: number) => {
  const { data } = await api.post('/applications', { job_id: jobId });
  return data;
};
