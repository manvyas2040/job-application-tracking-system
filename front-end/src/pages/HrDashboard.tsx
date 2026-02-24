import { FormEvent, useState } from 'react';
import { bulkReject, bulkShortlist, listApplications, updateApplicationState } from '../api/applications';
import { getJobAnalytics, getJobById, updateJobState } from '../api/jobs';
import { scheduleInterview } from '../api/interviews';

const JOB_TRANSITIONS: Record<string, string[]> = {
  draft: ['open', 'archived'],
  open: ['closed'],
  closed: ['archived'],
  archived: [],
};

export default function HrDashboard() {
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState('open');
  const [message, setMessage] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [applications, setApplications] = useState<Array<{ application_id: number; application_status: string }>>([]);

  const onTransition = async () => {
    if (!jobId) return;
    try {
      const job = await getJobById(Number(jobId));
      const allowed = JOB_TRANSITIONS[job.job_status] ?? [];
      if (!allowed.includes(jobStatus)) {
        setMessage(`Invalid transition from ${job.job_status} to ${jobStatus}`);
        return;
      }
      await updateJobState(Number(jobId), jobStatus);
      setMessage('Job state updated');
    } catch {
      setMessage('Job state update failed');
    }
  };

  const onAnalytics = async () => {
    if (!jobId) return;
    try {
      const data = await getJobAnalytics(Number(jobId));
      setMessage(`Applications: ${data.applications}, Interviews: ${data.interviews}`);
    } catch {
      setMessage('Analytics failed');
    }
  };

  const onLoadApplications = async () => {
    try {
      const rows = await listApplications();
      setApplications(rows.map((r) => ({ application_id: r.application_id, application_status: r.application_status })));
    } catch {
      setMessage('Cannot load applications');
    }
  };

  const onAppState = async (nextState: string) => {
    try {
      await updateApplicationState(Number(applicationId), nextState);
      setMessage(`Application moved to ${nextState}`);
      await onLoadApplications();
    } catch {
      setMessage('Application transition failed');
    }
  };

  const onBulk = async (kind: 'shortlist' | 'reject') => {
    const ids = applications.slice(0, 2).map((a) => a.application_id);
    if (!ids.length) return;
    try {
      if (kind === 'shortlist') await bulkShortlist(ids);
      else await bulkReject(ids);
      setMessage(`Bulk ${kind} done on ${ids.join(', ')}`);
      await onLoadApplications();
    } catch {
      setMessage(`Bulk ${kind} failed`);
    }
  };

  const onSchedule = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await scheduleInterview({
        application_id: Number(applicationId),
        interview_date: new Date().toISOString(),
        interview_type: 'technical',
        interviewer_id: 1,
      });
      setMessage('Interview scheduled');
    } catch {
      setMessage('Interview schedule failed');
    }
  };

  return (
    <div className="stack">
      <h2>HR Dashboard</h2>
      <div className="row">
        <input placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
        <input placeholder="Next job status" value={jobStatus} onChange={(e) => setJobStatus(e.target.value)} />
        <button onClick={onTransition}>Apply state transition</button>
        <button onClick={onAnalytics}>View analytics</button>
      </div>

      <div className="row">
        <input placeholder="Application ID" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} />
        <button onClick={onLoadApplications}>Load my applications</button>
        <button onClick={() => onAppState('shortlisted')}>Shortlist</button>
        <button onClick={() => onAppState('rejected')}>Reject</button>
      </div>

      <form className="row" onSubmit={onSchedule}>
        <button type="submit">Schedule Interview (now)</button>
      </form>

      <div className="row">
        <button onClick={() => onBulk('shortlist')}>Bulk Shortlist (first 2)</button>
        <button onClick={() => onBulk('reject')}>Bulk Reject (first 2)</button>
      </div>

      <ul>
        {applications.map((a) => (
          <li key={a.application_id}>
            #{a.application_id} - {a.application_status}
          </li>
        ))}
      </ul>

      {message && <p>{message}</p>}
    </div>
  );
}
