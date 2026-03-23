import { useState, useEffect } from 'react';
import { apiCall, getUser } from '../api';
import { motion } from 'motion/react';
import { Briefcase, FileText, Calendar, TrendingUp, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const user = getUser();
  const [stats, setStats] = useState({
    jobs: 0,
    applications: 0,
    interviews: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [jobsData, appsData, interviewsData] = await Promise.all([
          apiCall('/jobs'),
          apiCall('/applications'),
          apiCall('/interviews?start=' + new Date().toISOString().slice(0, 10))
        ]);

        setStats({
          jobs: jobsData.total || jobsData.items?.length || 0,
          applications: appsData.total || 0,
          interviews: interviewsData?.length || 0
        });

        setRecentJobs(jobsData.items?.slice(0, 5) || []);
        setUpcomingInterviews(interviewsData?.slice(0, 5) || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.email.split('@')[0]}!</h1>
          <p className="text-slate-500">Here's what's happening with your hiring pipeline today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/jobs" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Browse Jobs
          </Link>
          {['hr', 'admin'].includes(user?.role || '') && (
            <Link to="/interviews" className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all">
              Manage Interviews
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Jobs</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.jobs}</h3>
          </div>
        </motion.div>
        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Applications</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.applications}</h3>
          </div>
        </motion.div>
        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Interviews</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.interviews}</h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" /> Recent Job Postings
            </h2>
            <Link to="/jobs" className="text-sm text-blue-600 font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {recentJobs.length > 0 ? recentJobs.map((job) => (
              <Link 
                key={job.job_id} 
                to={`/job-detail/${job.job_id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-blue-700">{job.job_title}</h4>
                  <p className="text-sm text-slate-500">{job.department} • {job.job_status}</p>
                </div>
                <div className="text-xs font-medium text-slate-400">
                  {new Date(job.posted_date).toLocaleDateString()}
                </div>
              </Link>
            )) : (
              <p className="text-center py-8 text-slate-400">No recent jobs found.</p>
            )}
          </div>
        </motion.section>

        <motion.section variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-amber-600" /> Upcoming Interviews
            </h2>
            <Link to="/interviews" className="text-sm text-blue-600 font-semibold hover:underline">View schedule</Link>
          </div>
          <div className="space-y-4">
            {upcomingInterviews.length > 0 ? upcomingInterviews.map((interview) => (
              <div 
                key={interview.interview_id}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {interview.candidate_name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{interview.candidate_name || 'Candidate'}</h4>
                  <p className="text-sm text-slate-500 truncate">{interview.interview_type} • {interview.interviewer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(interview.start).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(interview.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-center py-8 text-slate-400">No upcoming interviews.</p>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
