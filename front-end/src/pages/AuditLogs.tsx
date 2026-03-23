import { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { motion } from 'motion/react';
import { Shield, Clock, User, Activity } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiCall('/audit-logs');
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Shield className="text-blue-600" /> Audit Logs
        </h1>
        <p className="text-slate-500">Security and activity logs for system monitoring.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length > 0 ? logs.map((log, index) => (
                <motion.tr 
                  key={log.log_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-400">#{log.log_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <User size={14} className="text-slate-300" /> {log.user_id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-blue-500" />
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        log.action.includes('password') ? 'bg-amber-100 text-amber-700' :
                        log.action.includes('role') ? 'bg-blue-100 text-blue-700' :
                        log.action.includes('deactivated') ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock size={14} className="text-slate-300" /> {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
