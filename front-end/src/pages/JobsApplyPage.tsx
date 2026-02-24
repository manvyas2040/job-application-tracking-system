import { FormEvent, useState } from 'react';
import { applyToJob, getJobById, Job } from '../api/jobs';

export default function JobsApplyPage() {
  const [jobId, setJobId] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState('');

  const loadJob = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await getJobById(Number(jobId));
      setJob(data);
      setMessage('Job loaded');
    } catch {
      setMessage('Job not found');
      setJob(null);
    }
  };

  const onApply = async () => {
    if (!jobId) return;
    try {
      await applyToJob(Number(jobId));
      setMessage('Application submitted');
    } catch {
      setMessage('Apply failed (check open status / duplicate / profile).');
    }
  };

  return (
    <div className="stack">
      <h2>Job Lookup & Apply</h2>
      <form className="row" onSubmit={loadJob}>
        <input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ID" />
        <button type="submit">Load Job</button>
      </form>

      {job && (
        <div className="card">
          <h3>{job.job_titel}</h3>
          <p>{job.job_description}</p>
          <p>Status: {job.job_status}</p>
          <button onClick={onApply}>Apply to this job</button>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}
