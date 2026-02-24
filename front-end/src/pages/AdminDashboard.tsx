import { FormEvent, useEffect, useState } from 'react';
import { changeRole, deactivateUser, getAuditLogs, listUsers, restoreUser, UserRow } from '../api/users';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditRows, setAuditRows] = useState<Array<{ timestamp: string; user_id: number; action: string }>>([]);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const data = await listUsers({ role: role || undefined, status: status || undefined, page: 1, page_size: 50 });
      setUsers(data.items);
    } catch {
      setMessage('Cannot load users. Check admin token.');
    }
  };

  const loadAudit = async () => {
    try {
      const rows = await getAuditLogs();
      setAuditRows(rows);
    } catch {
      setMessage('Cannot load audit logs.');
    }
  };

  useEffect(() => {
    void load();
    void loadAudit();
  }, []);

  const onFilter = async (e: FormEvent) => {
    e.preventDefault();
    await load();
  };

  const onRoleChange = async (userId: number, newRole: string) => {
    try {
      await changeRole(userId, newRole);
      setMessage(`Role updated for user ${userId}`);
      await load();
    } catch {
      setMessage('Role update failed');
    }
  };

  return (
    <div className="stack">
      <h2>Admin Dashboard</h2>
      <form className="row" onSubmit={onFilter}>
        <input placeholder="Filter role" value={role} onChange={(e) => setRole(e.target.value)} />
        <input placeholder="Filter status" value={status} onChange={(e) => setStatus(e.target.value)} />
        <button type="submit">Apply filters</button>
      </form>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.status}</td>
                <td className="row">
                  <button type="button" onClick={() => onRoleChange(u.user_id, 'hr')}>
                    Set HR
                  </button>
                  <button type="button" onClick={() => onRoleChange(u.user_id, 'candidate')}>
                    Set Candidate
                  </button>
                  <button type="button" onClick={() => deactivateUser(u.user_id).then(load)}>
                    Deactivate
                  </button>
                  <button type="button" onClick={() => restoreUser(u.user_id).then(load)}>
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Audit Logs</h3>
      <ul className="auditList">
        {auditRows.slice(0, 20).map((a, idx) => (
          <li key={`${a.timestamp}-${idx}`}>
            {a.timestamp} — user {a.user_id}: {a.action}
          </li>
        ))}
      </ul>

      {message && <p>{message}</p>}
    </div>
  );
}
