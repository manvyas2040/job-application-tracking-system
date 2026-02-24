import { useEffect, useMemo, useState } from 'react';
import { login, register } from './api/auth';
import { setAccessToken, setAuthFailureHandler } from './api/client';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import HrDashboard from './pages/HrDashboard';
import InterviewerDashboard from './pages/InterviewerDashboard';
import { AuthRole, detectRole, roleNav } from './utils';

const roleLabel: Record<AuthRole, string> = {
  admin: 'Admin',
  hr: 'HR',
  candidate: 'Candidate',
  interviewer: 'Interviewer',
  unknown: 'Unknown',
};

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerRole, setRegisterRole] = useState('candidate');
  const [accessToken, setAccessTokenState] = useState<string | null>(localStorage.getItem('access_token'));
  const [message, setMessage] = useState('');
  const [activeNav, setActiveNav] = useState('');

  const role = useMemo(() => detectRole(accessToken), [accessToken]);

  useEffect(() => {
    setAccessToken(accessToken);
    setAuthFailureHandler(() => {
      setMessage('Session expired. Please login again.');
      logout();
    });
  }, [accessToken]);

  useEffect(() => {
    const firstNav = role !== 'unknown' ? roleNav[role][0] : '';
    setActiveNav(firstNav);
  }, [role]);

  const loginSubmit = async () => {
    try {
      const data = await login({ email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setAccessTokenState(data.access_token);
      setMessage('Login successful');
    } catch {
      setMessage('Login failed');
    }
  };

  const registerSubmit = async () => {
    try {
      const data = await register({ name, email, password, role: registerRole });
      setMessage(`Registered: ${JSON.stringify(data)}`);
    } catch {
      setMessage('Register failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessTokenState(null);
    setAccessToken(null);
  };

  const renderDashboard = () => {
    if (role === 'admin') return <AdminDashboard />;
    if (role === 'hr') return <HrDashboard />;
    if (role === 'candidate') return <CandidateDashboard />;
    if (role === 'interviewer') return <InterviewerDashboard />;
    return <p>Login to continue.</p>;
  };

  return (
    <main className="appShell">
      <header className="topbar">
        <div>
          <h1>JATS — Intermediate Workflow Frontend</h1>
          <p>Role-aware, token-refresh, workflow-driven UI</p>
        </div>
        <div className="row">
          <span className="badge">{roleLabel[role]}</span>
          {accessToken && <button onClick={logout}>Logout</button>}
        </div>
      </header>

      {!accessToken ? (
        <section className="authPanel card">
          <h2>Login / Register</h2>
          <div className="grid2">
            <div className="stack">
              <h3>Login</h3>
              <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={loginSubmit}>Login</button>
            </div>
            <div className="stack">
              <h3>Register</h3>
              <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input placeholder="Role (admin/hr/candidate/interviewer)" value={registerRole} onChange={(e) => setRegisterRole(e.target.value)} />
              <button onClick={registerSubmit}>Register</button>
            </div>
          </div>
          {message && <p>{message}</p>}
        </section>
      ) : (
        <section className="workspace">
          <aside className="sidebar card">
            <h3>Navigation</h3>
            {(role !== 'unknown' ? roleNav[role] : []).map((n) => (
              <button key={n} className={activeNav === n ? 'active' : ''} onClick={() => setActiveNav(n)}>
                {n}
              </button>
            ))}
          </aside>
          <section className="content card">{renderDashboard()}</section>
        </section>
      )}
    </main>
  );
}
