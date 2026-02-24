import { useEffect, useState } from 'react';
import { setAccessToken } from './api/client';
import Card from './components/Card';
import CandidateProfilePage from './pages/CandidateProfilePage';
import JobsApplyPage from './pages/JobsApplyPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('access_token')));

  useEffect(() => {
    setAccessToken(localStorage.getItem('access_token'));
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setIsLoggedIn(false);
  };

  return (
    <main className="layout">
      <h1>Job Application Tracking - Frontend Starter</h1>
      <div className="grid">
        <Card title="Authentication">
          {isLoggedIn ? <button onClick={logout}>Logout</button> : <LoginPage onLoggedIn={() => setIsLoggedIn(true)} />}
        </Card>

        <Card title="Candidate Profile">
          {isLoggedIn ? <CandidateProfilePage isLoggedIn={isLoggedIn} /> : <p>Login first</p>}
        </Card>

        <Card title="Jobs & Apply">
          {isLoggedIn ? <JobsApplyPage /> : <p>Login first</p>}
        </Card>
      </div>
    </main>
  );
}
