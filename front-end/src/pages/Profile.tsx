import React, { useState, useEffect } from 'react';
import { apiCall, getUser, API_URL, getToken } from '../api';
import { motion } from 'motion/react';
import { User, Phone, Code, Award, FileText, Download, RefreshCw, Save } from 'lucide-react';

export default function Profile() {
  const user = getUser();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    skills: '',
    experience_years: 0
  });

  const fetchProfile = async () => {
    try {
      const data = await apiCall('/candidate/profile');
      setProfile(data);
      setFormData({
        phone: data.phone,
        skills: data.skills,
        experience_years: data.experience_years
      });
    } catch (error: any) {
      if (error.message.includes('404')) {
        window.location.href = '/create-profile';
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/candidate/profile', {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      setIsEditing(false);
      fetchProfile();
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/files/upload/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: uploadData
      });

      if (!response.ok) throw new Error('Upload failed');
      fetchProfile();
      alert('Resume updated successfully!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const downloadResume = async () => {
    if (!profile?.resume_path) return;
    try {
      const response = await fetch(`${API_URL}/files/resume/${profile.resume_path}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = profile.resume_path;
      a.click();
    } catch (error) {
      alert('Download failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your professional information and resume.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            Edit Profile
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Phone size={16} /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Code size={16} /> Skills (comma separated)
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Award size={16} /> Years of Experience
                  </label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    <Save size={20} /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold">
                    {user?.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{user?.email.split('@')[0]}</h2>
                    <p className="text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                    <p className="text-lg font-medium text-slate-700">{profile?.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                    <p className="text-lg font-medium text-slate-700">{profile?.experience_years} Years</p>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile?.skills.split(',').map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Resume
            </h3>
            
            {profile?.resume_path ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-blue-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-blue-900 truncate">{profile.resume_path}</p>
                      <p className="text-xs text-blue-600">PDF Document</p>
                    </div>
                  </div>
                  <button onClick={downloadResume} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                    <Download size={20} />
                  </button>
                </div>
                <div className="relative">
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={18} /> Replace Resume
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 font-medium">Upload PDF Resume</p>
                  <p className="text-xs text-slate-400 mt-1">Max 10MB</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  );
}
