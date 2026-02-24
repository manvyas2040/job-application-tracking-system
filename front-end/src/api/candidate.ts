import { api } from './client';

export type CandidateProfilePayload = {
  phone?: string;
  skills?: string;
  experience_years?: number;
  resume_path?: string;
};

export const getCandidateProfile = async () => {
  const { data } = await api.get('/candidate/profile');
  return data as CandidateProfilePayload;
};

export const createCandidateProfile = async (payload: CandidateProfilePayload) => {
  const { data } = await api.post('/candidate/profile', payload);
  return data;
};

export const updateCandidateProfile = async (payload: CandidateProfilePayload) => {
  const { data } = await api.patch('/candidate/profile', payload);
  return data;
};
