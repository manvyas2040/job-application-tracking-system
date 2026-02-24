import { api } from './client';

export type Job = {
  job_id: number;
  job_titel: string;
  job_description: string;
  department?: string;
  job_status: string;
  owner_hr_id?: number;
};

export const getJobById = async (jobId: number) => {
  const { data } = await api.get(`/jobs/${jobId}`);
  return data as Job;
};

export const createJob = async (payload: {
  job_title: string;
  job_description: string;
  company_id: number;
  department?: string;
  experience_required?: number;
}) => {
  const { data } = await api.post('/jobs', payload);
  return data as Job;
};

export const updateJobState = async (jobId: number, jobStatus: string) => {
  const { data } = await api.patch(`/jobs/${jobId}/state`, { job_status: jobStatus });
  return data as Job;
};

export const getJobAnalytics = async (jobId: number) => {
  const { data } = await api.get(`/jobs/${jobId}/analytics`);
  return data as { job_id: number; applications: number; interviews: number };
};

export const applyToJob = async (jobId: number) => {
  const { data } = await api.post('/applications', { job_id: jobId });
  return data;
};
