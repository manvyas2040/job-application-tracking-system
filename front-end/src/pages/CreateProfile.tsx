import React, { useState } from 'react';
import { apiCall, setUser, getUser } from '../api';
import { motion } from 'motion/react';
import { User, Phone, Code, Award, FileText, Send } from 'lucide-react';

export default function CreateProfile() {
  const user = getUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    skills: '',
    experience_years: 0,
    resume_path: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiCall('/candidate/profile', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (user) {
        setUser({ ...user, profile_complete: true });
      }
      
      alert('Profile created successfully!');
      window.location.href = '/dashboard';
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="bg-blue-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="opacity-80">Tell us more about yourself to start applying for jobs.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Phone size={16} /> Phone Number
              </label>
              <input 
                type="tel" 
                required 
                placeholder="+1234567890"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Award size={16} /> Years of Experience
              </label>
              <input 
                type="number" 
                required 
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.experience_years}
                onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Code size={16} /> Skills
            </label>
            <textarea 
              required 
              rows={3}
              placeholder="e.g. React, TypeScript, Node.js, AWS"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
            />
            <p className="text-xs text-slate-400">Separate skills with commas.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText size={16} /> Resume Path / URL
            </label>
            <input 
              type="text" 
              placeholder="/resumes/john-doe.pdf"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.resume_path}
              onChange={(e) => setFormData({...formData, resume_path: e.target.value})}
            />
            <p className="text-xs text-slate-400">You can upload a PDF file later from your profile page.</p>
          </div>

          <button 
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
            Create Profile
          </button>
        </form>
      </motion.div>
    </div>
  );
}
