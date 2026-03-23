import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { getUser, User } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Profile from './pages/Profile';
import CreateProfile from './pages/CreateProfile';
import Notifications from './pages/Notifications';
import Interviews from './pages/Interviews';
import Calendar from './pages/Calendar';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import ChangePassword from './pages/ChangePassword';
import CandidateProfile from './pages/CandidateProfile';
import Navbar from './components/Navbar';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUserState] = useState<User | null>(getUser());

  useEffect(() => {
    const handleStorageChange = () => {
      setUserState(getUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
    if (!user) return <Navigate to="/" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {user && <Navbar user={user} />}
        <main className={user ? "container mx-auto px-4 py-8" : ""}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/jobs" element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              } />
              
              <Route path="/job-detail/:id" element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              } />
              
              <Route path="/applications" element={
                <ProtectedRoute>
                  <Applications />
                </ProtectedRoute>
              } />
              
              <Route path="/application-detail/:id" element={
                <ProtectedRoute>
                  <ApplicationDetail />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute roles={['candidate']}>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/create-profile" element={
                <ProtectedRoute roles={['candidate']}>
                  <CreateProfile />
                </ProtectedRoute>
              } />
              
              <Route path="/notifications" element={
                <ProtectedRoute roles={['candidate']}>
                  <Notifications />
                </ProtectedRoute>
              } />
              
              <Route path="/interviews" element={
                <ProtectedRoute roles={['hr', 'admin', 'interviewer']}>
                  <Interviews />
                </ProtectedRoute>
              } />

              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute roles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              
              <Route path="/audit-logs" element={
                <ProtectedRoute roles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              } />
              
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } />

              <Route path="/candidate-profile/:id" element={
                <ProtectedRoute roles={['hr', 'admin', 'interviewer']}>
                  <CandidateProfile />
                </ProtectedRoute>
              } />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}
