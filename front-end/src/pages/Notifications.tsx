import { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle, Info, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await apiCall('/notifications');
      setNotifications(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await apiCall(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="text-blue-500" />;
      case 'action_required': return <AlertTriangle className="text-amber-500" />;
      case 'success': return <CheckCircle className="text-green-500" />;
      default: return <Bell className="text-slate-400" />;
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
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500">Stay updated on your application progress.</p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
          {notifications.filter(n => !n.is_read).length} New
        </div>
      </header>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
            <Bell size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
          <p className="text-slate-500">You don't have any notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.notification_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !notif.is_read && markAsRead(notif.notification_id)}
                className={`p-6 rounded-2xl border transition-all flex gap-4 group cursor-pointer ${
                  notif.is_read 
                    ? 'bg-white border-slate-100 opacity-75' 
                    : 'bg-white border-blue-200 shadow-lg shadow-blue-500/5'
                }`}
              >
                <div className={`p-3 rounded-xl h-fit ${
                  notif.is_read ? 'bg-slate-50' : 'bg-blue-50'
                }`}>
                  {getIcon(notif.notification_type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      notif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {notif.notification_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(notif.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className={`text-slate-800 leading-relaxed ${!notif.is_read ? 'font-semibold' : ''}`}>
                    {notif.message}
                  </p>

                  {notif.related_application_id && (
                    <Link 
                      to={`/application-detail/${notif.related_application_id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors pt-2"
                    >
                      View Application <ExternalLink size={14} />
                    </Link>
                  )}
                </div>

                {!notif.is_read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
