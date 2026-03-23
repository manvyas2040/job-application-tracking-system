import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiCall, getToken, API_URL } from '../api';
import { motion } from 'motion/react';
import { ArrowLeft, User, Phone, Code, Award, FileText, Download, Calendar, Briefcase } from 'lucide-react';

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await apiCall(`/candidates/${id}/full-profile`);
        setData(profileData);
      } catch (error) {
        console.error('Error fetching candidate profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const downloadResume = async () => {
    if (!data?.profile.resume_path) return;
    try {
      const response = await fetch(`${API_URL}/files/resume/${data.profile.resume_path}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.profile.resume_path;
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

  if (!data) return <div className="text-center py-20 text-slate-500">Candidate not found.</div>;

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
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-4xl font-bold">
                {data.user.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{data.user.name}</h1>
                <p className="text-slate-500">{data.user.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    data.user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {data.user.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Phone size={14} /> Phone
                </p>
                <p className="text-lg font-medium text-slate-700">{data.profile.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Award size={14} /> Experience
                </p>
                <p className="text-lg font-medium text-slate-700">{data.profile.experience_years} Years</p>
              </div>
              <div className="md:col-span-2 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Code size={14} /> Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.profile.skills.split(',').map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-600" /> Application History
            </h2>
            <div className="space-y-4">
              {data.applications.length > 0 ? data.applications.map((app: any) => (
                <Link 
                  key={app.application_id} 
                  to={`/application-detail/${app.application_id}`}
                  className="block p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-700">Application #{app.application_id}</h4>
                      <p className="text-sm text-slate-500">Job ID: {app.job_id} • Applied {new Date(app.applied_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      app.application_status === 'hired' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {app.application_status}
                    </span>
                  </div>
                </Link>
              )) : (
                <p className="text-center py-8 text-slate-400">No applications found.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Resume
            </h3>
            {data.profile.resume_path ? (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={24} className="text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-blue-900 truncate">{data.profile.resume_path}</p>
                    <p className="text-xs text-blue-600">PDF Document</p>
                  </div>
                </div>
                <button onClick={downloadResume} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                  <Download size={20} />
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No resume uploaded.</p>
            )}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" /> Interviews
            </h3>
            <div className="space-y-4">
              {data.interviews.length > 0 ? data.interviews.map((interview: any) => (
                <div key={interview.interview_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{interview.interview_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      interview.interview_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {interview.interview_status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{new Date(interview.interview_date).toLocaleString()}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-4">No interviews scheduled.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
