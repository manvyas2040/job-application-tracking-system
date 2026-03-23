import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall, getUser, API_URL, getToken } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, FileText, Calendar, User, Briefcase, CheckCircle, XCircle, Clock, Download, Plus, Trash2 } from 'lucide-react';

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [app, setApp] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  const [newStatus, setNewStatus] = useState('');
  const [interviewForm, setInterviewForm] = useState({
    interview_date: '',
    interview_type: 'technical',
    interviewer_id: ''
  });
  const [interviewers, setInterviewers] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const data = await apiCall('/applications');
      const foundApp = data.items?.find((a: any) => a.application_id == id);
      if (!foundApp) throw new Error('Application not found');
      setApp(foundApp);

      const [jobData, interviewsData, docsData] = await Promise.all([
        apiCall(`/jobs/${foundApp.job_id}`),
        apiCall(`/interviews/application/${foundApp.application_id}`).catch(() => []),
        apiCall(`/files/application/${foundApp.application_id}/documents`).catch(() => ({ documents: [] }))
      ]);

      setJob(jobData);
      setInterviews(interviewsData);
      setDocuments(docsData.documents || []);

      if (['hr', 'admin', 'interviewer'].includes(user?.role || '')) {
        const candidateData = await apiCall(`/candidates/${foundApp.candidate_id}/full-profile`);
        setCandidate(candidateData);
        
        if (['hr', 'admin'].includes(user?.role || '')) {
          const interviewersData = await apiCall('/users?role=interviewer&page_size=100');
          setInterviewers(interviewersData.items || []);
        }
      }
    } catch (error) {
      console.error('Error fetching application detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall(`/applications/${id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ application_status: newStatus })
      });
      setIsStatusModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/interviews', {
        method: 'POST',
        body: JSON.stringify({
          application_id: parseInt(id!),
          ...interviewForm,
          interviewer_id: parseInt(interviewForm.interviewer_id)
        })
      });
      setIsInterviewModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/files/upload/document/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      fetchData();
      setIsDocModalOpen(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const downloadFile = async (filename: string, type: 'resume' | 'document') => {
    try {
      const endpoint = type === 'resume' ? `/files/resume/${filename}` : `/files/interview/${filename}`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
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

  if (!app) return <div className="text-center py-20 text-slate-500">Application not found.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Application #{app.application_id}</h1>
                <p className="text-slate-500">Applied on {new Date(app.applied_date).toLocaleDateString()}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                app.application_status === 'hired' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {app.application_status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-600" /> Job Information
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Title:</span> {job?.job_title}</p>
                  <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Department:</span> {job?.department}</p>
                  <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Status:</span> {job?.job_status}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <User size={18} className="text-blue-600" /> Candidate Info
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Name:</span> {candidate?.user.name || 'N/A'}</p>
                  <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Email:</span> {candidate?.user.email || 'N/A'}</p>
                  <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Phone:</span> {candidate?.profile.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" /> Interview History
            </h2>
            <div className="space-y-4">
              {interviews.length > 0 ? interviews.map((interview) => (
                <div key={interview.interview_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900">{interview.interview_type} Round</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Clock size={14} /> {new Date(interview.interview_date).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Interviewer: {interview.interviewer_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    interview.interview_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {interview.interview_status}
                  </span>
                </div>
              )) : (
                <p className="text-center py-8 text-slate-400">No interviews scheduled yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {['hr', 'admin'].includes(user?.role || '') && (
                <>
                  <button 
                    onClick={() => setIsStatusModalOpen(true)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    Change Status
                  </button>
                  {app.application_status === 'shortlisted' && (
                    <button 
                      onClick={() => setIsInterviewModalOpen(true)}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      Schedule Interview
                    </button>
                  )}
                </>
              )}
              {['hr', 'admin', 'interviewer'].includes(user?.role || '') && (
                <button 
                  onClick={() => setIsDocModalOpen(true)}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add Document
                </button>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Documents</h3>
            <div className="space-y-3">
              {candidate?.profile.resume_path && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={18} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 truncate">Resume.pdf</span>
                  </div>
                  <button onClick={() => downloadFile(candidate.profile.resume_path, 'resume')} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              )}
              {documents.map((doc) => (
                <div key={doc.filename} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 truncate">{doc.filename}</span>
                  </div>
                  <button onClick={() => downloadFile(doc.filename, 'document')} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              ))}
              {!candidate?.profile.resume_path && documents.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No documents available.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Status Modal */}
      <AnimatePresence>
        {isStatusModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStatusModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Update Application Status</h2>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <select 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsStatusModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Update</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interview Modal */}
      <AnimatePresence>
        {isInterviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInterviewModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Schedule Interview</h2>
              <form onSubmit={handleScheduleInterview} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
                    value={interviewForm.interview_date}
                    onChange={(e) => setInterviewForm({...interviewForm, interview_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
                    value={interviewForm.interview_type}
                    onChange={(e) => setInterviewForm({...interviewForm, interview_type: e.target.value})}
                    required
                  >
                    <option value="technical">Technical</option>
                    <option value="hr">HR Round</option>
                    <option value="managerial">Managerial</option>
                    <option value="cultural">Cultural Fit</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Interviewer</label>
                  <select 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
                    value={interviewForm.interviewer_id}
                    onChange={(e) => setInterviewForm({...interviewForm, interviewer_id: e.target.value})}
                    required
                  >
                    <option value="">Select Interviewer</option>
                    {interviewers.map(i => <option key={i.user_id} value={i.user_id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsInterviewModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl">Schedule</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Modal */}
      <AnimatePresence>
        {isDocModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDocModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Upload Document</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Plus size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 font-medium">Click or drag PDF to upload</p>
                  <p className="text-xs text-slate-400 mt-1">Max file size: 10MB</p>
                </div>
                <button onClick={() => setIsDocModalOpen(false)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
