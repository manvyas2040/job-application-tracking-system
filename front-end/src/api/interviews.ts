import { api } from './client';

export const scheduleInterview = async (payload: {
  application_id: number;
  interview_date: string;
  interview_type: string;
  interviewer_id: number;
}) => {
  const { data } = await api.post('/interviews', payload);
  return data;
};

export const updateInterviewState = async (interviewId: number, interviewStatus: string) => {
  const { data } = await api.patch(`/interviews/${interviewId}`, { interview_status: interviewStatus });
  return data;
};

export const submitFeedback = async (payload: {
  interview_id: number;
  interviewer_id: number;
  rating?: number;
  comments?: string;
  recommendation?: string;
}) => {
  const { data } = await api.post('/feedback', payload);
  return data;
};
