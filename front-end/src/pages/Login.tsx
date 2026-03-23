import React, { useState } from 'react';
import { apiCall, setUser, setToken, API_URL } from '../api';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'candidate'  // Always candidate for registration
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id.split('-')[1]]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginData = new URLSearchParams();
      loginData.append('username', formData.email);
      loginData.append('password', formData.password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      setUser({
        user_id: payload.sub,
        email: formData.email,
        role: payload.role,
      });

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiCall('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(formData),
      });

      setSuccess('Registration successful! Please login.');
      setTimeout(() => setIsLogin(true), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-blue-600 p-8 text-center text-white">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-5xl mb-4"
          >
            🎯
          </motion.div>
          <h1 className="text-3xl font-bold">JATS</h1>
          <p className="opacity-80">Job Application Tracking System</p>
        </div>

        <div className="flex bg-slate-50">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 text-sm font-semibold transition-all ${isLogin ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-4 text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Register
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Welcome Back</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Mail size={16} /> Email
                    </label>
                    <input 
                      type="email" 
                      id="login-email" 
                      required 
                      placeholder="name@company.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Lock size={16} /> Password
                    </label>
                    <input 
                      type="password" 
                      id="login-password" 
                      required 
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      onChange={handleInputChange}
                    />
                  </div>
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
                  <button 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn size={20} />}
                    Login
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Create Account</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <UserIcon size={16} /> Full Name
                    </label>
                    <input 
                      type="text" 
                      id="register-name" 
                      required 
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Mail size={16} /> Email
                    </label>
                    <input 
                      type="email" 
                      id="register-email" 
                      required 
                      placeholder="name@company.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Lock size={16} /> Password
                    </label>
                    <input 
                      type="password" 
                      id="register-password" 
                      required 
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                    💡 <strong>Note:</strong> Candidates register here. HR Managers, Interviewers, and Admins are created by an Administrator.
                  </p>
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
                  {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>}
                  <button 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={20} />}
                    Register
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

import { AnimatePresence } from 'motion/react';
