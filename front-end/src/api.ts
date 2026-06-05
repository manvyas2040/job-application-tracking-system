/**
 * API Configuration and Helper Functions
 * Ported from the original app.js
 */

export const API_URL = 'job-application-tracking-system-production.up.railway.app' ;

export interface User {
  user_id: string;
  email: string;
  role: 'candidate' | 'hr' | 'interviewer' | 'admin';
  name?: string;
  profile_complete?: boolean;
}

export function getToken() {
  return localStorage.getItem('access_token');
}

export function setToken(token: string) {
  localStorage.setItem('access_token', token);
}

export function getUser(): User | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setToken(data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiCall(endpoint: string, options: any = {}) {
  const token = getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !options.skipAuth) {
      const refreshed = await refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getToken()}`;
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}`);
        }
        return await retryResponse.json();
      } else {
        logout();
        return null;
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
