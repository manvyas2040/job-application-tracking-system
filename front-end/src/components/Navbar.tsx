import { Link, useLocation } from 'react-router-dom';
import { User, logout, apiCall } from '../api';
import { useState, useEffect } from 'react';
import { Bell, LogOut, User as UserIcon, Briefcase, FileText, Calendar, Shield, Key, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar({ user }: { user: User }) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user.role === 'candidate') {
      const fetchNotifications = async () => {
        try {
          const notifications = await apiCall('/notifications');
          const unread = notifications.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Briefcase },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/applications', label: 'Applications', icon: FileText },
  ];

  if (user.role === 'candidate') {
    navItems.push({ path: '/profile', label: 'Profile', icon: UserIcon });
    navItems.push({ path: '/notifications', label: 'Notifications', icon: Bell });
    navItems.push({ path: '/calendar', label: 'Calendar', icon: Calendar });
  }

  if (['hr', 'admin', 'interviewer'].includes(user.role)) {
    navItems.push({ path: '/interviews', label: 'Interviews', icon: Calendar });
    navItems.push({ path: '/calendar', label: 'Calendar', icon: Calendar });
  }

  if (user.role === 'admin') {
    navItems.push({ path: '/users', label: 'Users', icon: Users });
    navItems.push({ path: '/audit-logs', label: 'Audit Logs', icon: Shield });
  }

  navItems.push({ path: '/change-password', label: 'Security', icon: Key });

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1 rounded-lg">💻</span>
              <span className="hidden sm:inline">Nexora Technologies</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-900">{user.email}</span>
              <span className="text-xs text-slate-500 capitalize">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
