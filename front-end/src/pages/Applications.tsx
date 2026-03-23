import { useState, useEffect } from 'react';
import { apiCall, getUser } from '../api';
import { motion } from 'motion/react';
import { FileText, ExternalLink, Calendar, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Applications() {
  const user = getUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await apiCall('/applications');
        setApplications(data.items || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-700';
      case 'shortlisted': return 'bg-amber-100 text-amber-700';
      case 'interview_scheduled': return 'bg-indigo-100 text-indigo-700';
      case 'hired': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
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
        <h1 className="text-3xl font-bold text-slate-900">Applications</h1>
        <p className="text-slate-500">Track the status of your job applications and upcoming steps.</p>
      </header>

      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No applications yet</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Start your journey by browsing available jobs and applying for positions that match your skills.</p>
          <Link to="/jobs" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app, index) => (
            <motion.div
              key={app.application_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">Application #{app.application_id}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(app.application_status)}`}>
                      {app.application_status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Tag size={14} /> Job ID: {app.job_id}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> Applied {new Date(app.applied_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link 
                  to={`/application-detail/${app.application_id}`}
                  className="px-6 py-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                >
                  View Details <ExternalLink size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
