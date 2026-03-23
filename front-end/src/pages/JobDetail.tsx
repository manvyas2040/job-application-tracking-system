import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall, getUser } from '../api';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle, Send, ShieldCheck, AlertCircle } from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await apiCall(`/jobs/${id}`);
        setJob(data);
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (user?.role !== 'candidate') return;
    
    setIsApplying(true);
    try {
      // Check profile first
      try {
        await apiCall('/candidate/profile');
      } catch (error: any) {
        if (error.message.includes('404')) {
          alert('Please complete your profile before applying.');
          navigate('/create-profile');
          return;
        }
      }

      if (!confirm('Are you sure you want to apply for this position?')) {
        setIsApplying(false);
        return;
      }

      await apiCall('/applications', {
        method: 'POST',
        body: JSON.stringify({ job_id: parseInt(id!) })
      });

      alert('Application submitted successfully!');
      navigate('/applications');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Change job status to ${newStatus}?`)) return;
    try {
      await apiCall(`/jobs/${id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ job_status: newStatus })
      });
      setJob({ ...job, job_status: newStatus });
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

  if (!job) return <div className="text-center py-20 text-slate-500">Job not found.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
      >
        <ArrowLeft size={20} /> Back to Jobs
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 md:p-12 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  job.job_status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {job.job_status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400">
                  {job.department}
                </span>
              </div>
              <h1 className="text-4xl font-bold">{job.job_title}</h1>
              <div className="flex flex-wrap gap-6 text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin size={18} /> Remote / {job.department}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} /> {job.experience_required}+ Years Experience
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} /> Posted {new Date(job.posted_date).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {user?.role === 'candidate' && job.job_status === 'open' && (
              <button 
                onClick={handleApply}
                disabled={isApplying}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isApplying ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
                Apply for this Position
              </button>
            )}
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Job Description
            </h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
              {job.job_description}
            </div>
          </section>

          <section className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="text-amber-500" /> Requirements & Info
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle size={18} className="text-green-500" /> {job.experience_required} years of relevant experience
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle size={18} className="text-green-500" /> Department: {job.department}
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle size={18} className="text-green-500" /> Full-time position
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle size={18} className="text-green-500" /> Competitive benefits package
              </li>
            </ul>
          </section>

          {['hr', 'admin'].includes(user?.role || '') && (
            <section className="pt-8 border-t border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Management Actions</h3>
              <div className="flex flex-wrap gap-4">
                {job.job_status === 'draft' && (
                  <button onClick={() => handleStatusUpdate('open')} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">
                    Publish Job
                  </button>
                )}
                {job.job_status === 'open' && (
                  <button onClick={() => handleStatusUpdate('closed')} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">
                    Close Job
                  </button>
                )}
                {job.job_status === 'closed' && (
                  <button onClick={() => handleStatusUpdate('archived')} className="px-6 py-3 bg-slate-600 text-white rounded-xl font-bold hover:bg-slate-700 transition-all">
                    Archive Job
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
}
