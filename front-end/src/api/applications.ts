import { api } from './client';

export type ApplicationRow = {
  application_id: number;
  job_id: number;
  candidate_id: number;
  application_status: string;
};

export const listApplications = async () => {
  const { data } = await api.get('/applications');
  return data as ApplicationRow[];
};

export const updateApplicationState = async (applicationId: number, applicationStatus: string) => {
  const { data } = await api.patch(`/applications/${applicationId}/state`, { application_status: applicationStatus });
  return data;
};

export const bulkShortlist = async (applicationIds: number[]) => {
  const { data } = await api.post('/applications/bulk-shortlist', { application_ids: applicationIds });
  return data;
};

export const bulkReject = async (applicationIds: number[]) => {
  const { data } = await api.post('/applications/bulk-reject', { application_ids: applicationIds });
  return data;
};
