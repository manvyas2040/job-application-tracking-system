import React, { useState } from 'react';
import { apiCall, logout } from '../api';
import { motion } from 'motion/react';
import { Key, ShieldCheck, AlertCircle, Save } from 'lucide-react';

export default function ChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      alert('New passwords do not match!');
      return;
    }

    setIsLoading(true);
    try {
      await apiCall('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: formData.old_password,
          new_password: formData.new_password
        })
      });
      alert('Password changed successfully! Please login again.');
      logout();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Key className="text-blue-600" /> Security Settings
        </h1>
        <p className="text-slate-500">Update your password to keep your account secure.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <input 
                  type="password" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.old_password}
                  onChange={(e) => setFormData({...formData, old_password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.new_password}
                  onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                />
                <p className="text-xs text-slate-400">Minimum 6 characters.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                />
              </div>

              <button 
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
                Update Password
              </button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <ShieldCheck size={18} /> Password Tips
            </h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Use at least 8 characters</li>
              <li>• Mix letters, numbers, and symbols</li>
              <li>• Avoid using common words or names</li>
              <li>• Change your password every 90 days</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
              <AlertCircle size={18} /> Important
            </h4>
            <p className="text-sm text-amber-700">
              After changing your password, you will be automatically logged out and will need to sign in again with your new credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
