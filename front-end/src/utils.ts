export type AuthRole = 'admin' | 'hr' | 'candidate' | 'interviewer' | 'unknown';

export const decodeJwtPayload = (token: string | null): Record<string, unknown> | null => {
  if (!token) return null;
  try {
    const payloadPart = token.split('.')[1];
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const detectRole = (token: string | null): AuthRole => {
  const payload = decodeJwtPayload(token);
  const role = String(payload?.role ?? '').toLowerCase();
  if (role === 'admin' || role === 'hr' || role === 'candidate' || role === 'interviewer') {
    return role;
  }
  return 'unknown';
};

export const roleNav = {
  admin: ['users', 'audit'] as const,
  hr: ['jobs', 'applications', 'interviews'] as const,
  candidate: ['profile', 'jobs', 'applications', 'notifications'] as const,
  interviewer: ['feedback'] as const,
};
