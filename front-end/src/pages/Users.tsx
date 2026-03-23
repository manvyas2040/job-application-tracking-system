import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import { Users as UsersIcon, UserPlus, Shield, Trash2, RefreshCw, Filter, X, CheckCircle, XCircle } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  
  // Create user modal state
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'hr'
  });
  const [createUserError, setCreateUserError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let url = '/users?page=1&page_size=100';
      if (filters.role) url += `&role=${filters.role}`;
      if (filters.status) url += `&status=${filters.status}`;
      const data = await apiCall(url);
      setUsers(data.items || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await apiCall(`/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm('Restore this user?')) return;
    try {
      await apiCall(`/users/${id}/restore`, { method: 'POST' });
      fetchUsers();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall(`/users/${selectedUser.user_id}/role`, {
        method: 'POST',
        body: JSON.stringify({ new_role: newRole })
      });
      setIsRoleModalOpen(false);
      fetchUsers();
      alert('Role updated successfully!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    try {
      const response = await apiCall('/users/create', {
        method: 'POST',
        body: JSON.stringify(createUserForm)
      });
      setIsCreateUserModalOpen(false);
      setCreateUserForm({
        name: '',
        email: '',
        password: '',
        role: 'hr'
      });
      fetchUsers();
      alert(`${createUserForm.role.toUpperCase()} user created successfully!`);
    } catch (error: any) {
      setCreateUserError(error.message || 'Failed to create user');
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage system users, roles, and access permissions.</p>
        </div>
        <button 
          onClick={() => setIsCreateUserModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus size={20} /> Create User
        </button>
      </header>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Filter size={16} /> Filter by Role
          </label>
          <select 
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="candidate">Candidate</option>
            <option value="interviewer">Interviewer</option>
          </select>
        </div>
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Shield size={16} /> Filter by Status
          </label>
          <select 
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button 
          onClick={() => setFilters({ role: '', status: '' })}
          className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
        >
          Reset
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold">
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {u.is_active ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                    <span className={`text-sm font-medium ${u.is_active ? 'text-green-700' : 'text-red-700'}`}>
                      {u.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedUser(u);
                        setNewRole(u.role);
                        setIsRoleModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Change Role"
                    >
                      <Shield size={18} />
                    </button>
                    {u.is_active ? (
                      <button 
                        onClick={() => handleDeactivate(u.user_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRestore(u.user_id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Restore"
                      >
                        <RefreshCw size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Modal */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoleModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Change Role</h2>
                <button onClick={() => setIsRoleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleChangeRole} className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-500">Updating role for:</p>
                  <p className="font-bold text-slate-900">{selectedUser?.name}</p>
                  <p className="text-xs text-slate-400">{selectedUser?.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">New Role</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    required
                  >
                    <option value="candidate">Candidate</option>
                    <option value="hr">HR</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20">
                    Update Role
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateUserModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Create New User</h2>
                <button onClick={() => setIsCreateUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={createUserForm.name}
                    onChange={(e) => setCreateUserForm({...createUserForm, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="john@company.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm({...createUserForm, role: e.target.value})}
                  >
                    <option value="hr">HR Manager</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="admin">Admin</option>
                    <option value="candidate">Candidate</option>
                  </select>
                </div>

                {createUserError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{createUserError}</div>}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsCreateUserModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20">
                    Create User
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
