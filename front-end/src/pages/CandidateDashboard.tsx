import { useEffect, useState } from 'react';
import { listApplications } from '../api/applications';
import { createCandidateProfile, getCandidateProfile, updateCandidateProfile } from '../api/candidate';
import { applyToJob, getJobById } from '../api/jobs';
import { listNotifications, markNotificationRead, NotificationRow } from '../api/notifications';

export default function CandidateDashboard() {
  const [profile, setProfile] = useState({ phone: '', skills: '', experience_years: 0, resume_path: '' });
  const [jobId, setJobId] = useState('');
  const [jobInfo, setJobInfo] = useState('');
  const [applications, setApplications] = useState<Array<{ application_id: number; application_status: string }>>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [message, setMessage] = useState('');

  const loadProfile = async () => {
    try {
      const p = await getCandidateProfile();
      setProfile({
        phone: p.phone ?? '',
        skills: p.skills ?? '',
        experience_years: p.experience_years ?? 0,
        resume_path: p.resume_path ?? '',
      });
    } catch {
      setMessage('Profile not created yet.');
    }
  };

  const loadApps = async () => {
    try {
      const rows = await listApplications();
      setApplications(rows.map((r) => ({ application_id: r.application_id, application_status: r.application_status })));
    } catch {
      setMessage('Cannot load applications');
    }
  };

  const loadNotifications = async () => {
    try {
      setNotifications(await listNotifications());
    } catch {
      setMessage('Cannot load notifications');
    }
  };

  useEffect(() => {
    void loadProfile();
    void loadApps();
    void loadNotifications();
  }, []);

  const saveProfile = async () => {
    try {
      await createCandidateProfile(profile);
      setMessage('Profile created');
    } catch {
      await updateCandidateProfile(profile);
      setMessage('Profile updated');
    }
  };

  const loadJob = async () => {
    try {
      const j = await getJobById(Number(jobId));
      setJobInfo(`${j.job_titel} (${j.job_status})`);
    } catch {
      setJobInfo('Job not found');
    }
  };

  const apply = async () => {
    try {
      await applyToJob(Number(jobId));
      setMessage('Applied successfully');
      await loadApps();
      await loadNotifications();
    } catch {
      setMessage('Apply failed (open job/profile/duplicate check)');
    }
  };

  return (
    <div className="stack">
      <h2>Candidate Dashboard</h2>
      <div className="card stack">
        <h3>Profile</h3>
        <input placeholder="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        <input placeholder="Skills" value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} />
        <input
          placeholder="Experience years"
          type="number"
          value={profile.experience_years}
          onChange={(e) => setProfile({ ...profile, experience_years: Number(e.target.value) })}
        />
        <input
          placeholder="Resume path"
          value={profile.resume_path}
          onChange={(e) => setProfile({ ...profile, resume_path: e.target.value })}
        />
        <button onClick={saveProfile}>Save Profile</button>
      </div>

      <div className="card stack">
        <h3>Job Search + Apply</h3>
        <div className="row">
          <input placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
          <button onClick={loadJob}>Load</button>
          <button onClick={apply}>Apply</button>
        </div>
        {jobInfo && <p>{jobInfo}</p>}
      </div>

      <div className="card stack">
        <h3>Application History</h3>
        <ul>
          {applications.map((a) => (
            <li key={a.application_id}>
              #{a.application_id}: {a.application_status}
            </li>
          ))}
        </ul>
      </div>

      <div className="card stack">
        <h3>Notifications</h3>
        <ul>
          {notifications.map((n) => (
            <li key={n.notification_id} className="row between">
              <span>{n.message}</span>
              <button onClick={() => markNotificationRead(n.notification_id).then(loadNotifications)}>Mark read</button>
            </li>
          ))}
        </ul>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
}
