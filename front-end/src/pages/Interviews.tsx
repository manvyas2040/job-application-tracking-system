import React, { useState, useEffect } from 'react';
import { apiCall, getUser } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, User, Briefcase, CheckCircle, MessageSquare, Star, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Interviews() {
  const user = getUser();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comments: '',
    recommendation: 'hire'
  });

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const endpoint = user?.role === 'interviewer' ? '/interviews/my' : '/interviews?start=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const data = await apiCall(endpoint);
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/interviews/feedback', {
        method: 'POST',
        body: JSON.stringify({
          interview_id: selectedInterview.interview.interview_id,
          ...feedbackForm
        })
      });
      setIsFeedbackModalOpen(false);
      fetchInterviews();
      alert('Feedback submitted successfully!');
    } catch (error: any) {
      alert('Error: ' + error.message);
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
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Interview Desk</h1>
        <p className="text-slate-500">Manage scheduled interviews and provide candidate feedback.</p>
      </header>

      {interviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
            <Calendar size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No interviews found</h3>
          <p className="text-slate-500">There are no interviews scheduled for you at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {interviews.map((item, index) => {
            const interview = item.interview || item;
            const candidate = item.candidate || {};
            const job = item.job || {};
            
            return (
              <motion.div
                key={interview.interview_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                          {candidate.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{candidate.name || 'Candidate'}</h3>
                          <p className="text-slate-500 flex items-center gap-1.5 text-sm">
                            <Briefcase size={14} /> {job.job_title || 'Job Title'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        interview.interview_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {interview.interview_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-slate-50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={12} /> Date
                        </p>
                        <p className="font-bold text-slate-700">{new Date(interview.interview_date).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12} /> Time
                        </p>
                        <p className="font-bold text-slate-700">{new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <MessageSquare size={12} /> Type
                        </p>
                        <p className="font-bold text-slate-700 capitalize">{interview.interview_type}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {user?.role === 'interviewer' && !item.feedback && (
                        <button 
                          onClick={() => {
                            setSelectedInterview(item);
                            setIsFeedbackModalOpen(true);
                          }}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          <Star size={18} /> Submit Feedback
                        </button>
                      )}
                      <Link 
                        to={`/application-detail/${interview.application_id}`}
                        className="px-6 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
                      >
                        View Application
                      </Link>
                      {candidate.candidate_id && (
                        <Link 
                          to={`/candidate-profile/${candidate.candidate_id}`}
                          className="px-6 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
                        >
                          Candidate Profile
                        </Link>
                      )}
                    </div>
                  </div>

                  {item.feedback && (
                    <div className="md:w-72 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-500" /> Feedback Result
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Rating</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < item.feedback.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Recommendation</span>
                          <span className="text-sm font-bold text-slate-700 capitalize">{item.feedback.recommendation.replace('_', ' ')}</span>
                        </div>
                        <div className="pt-2">
                          <p className="text-xs text-slate-400 uppercase font-bold mb-1">Comments</p>
                          <p className="text-sm text-slate-600 italic line-clamp-3">"{item.feedback.comments}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFeedbackModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Interview Feedback</h2>
                <button onClick={() => setIsFeedbackModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Rating (1-5)</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFeedbackForm({...feedbackForm, rating: num})}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                          feedbackForm.rating === num ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Recommendation</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={feedbackForm.recommendation}
                    onChange={(e) => setFeedbackForm({...feedbackForm, recommendation: e.target.value})}
                    required
                  >
                    <option value="strong_hire">Strong Hire</option>
                    <option value="hire">Hire</option>
                    <option value="maybe">Maybe</option>
                    <option value="no_hire">No Hire</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Detailed Comments</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Share your thoughts on the candidate's performance..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={feedbackForm.comments}
                    onChange={(e) => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsFeedbackModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                    <Send size={20} /> Submit Feedback
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
