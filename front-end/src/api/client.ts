import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE,
});

export const setAccessToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
