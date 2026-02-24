import { FormEvent, useEffect, useState } from 'react';
import { createCandidateProfile, getCandidateProfile, updateCandidateProfile } from '../api/candidate';

type Props = {
  isLoggedIn: boolean;
};

export default function CandidateProfilePage({ isLoggedIn }: Props) {
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [resumePath, setResumePath] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;
    getCandidateProfile()
      .then((p) => {
        setPhone(p.phone ?? '');
        setSkills(p.skills ?? '');
        setExperienceYears(p.experience_years?.toString() ?? '');
        setResumePath(p.resume_path ?? '');
      })
      .catch(() => {
        setMessage('No profile yet. Create it below.');
      });
  }, [isLoggedIn]);

  const payload = {
    phone,
    skills,
    experience_years: experienceYears ? Number(experienceYears) : undefined,
    resume_path: resumePath,
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createCandidateProfile(payload);
      setMessage('Profile created');
    } catch {
      setMessage('Create failed (maybe already exists). Use Update.');
    }
  };

  const onUpdate = async () => {
    try {
      await updateCandidateProfile(payload);
      setMessage('Profile updated');
    } catch {
      setMessage('Update failed');
    }
  };

  return (
    <form className="stack" onSubmit={onCreate}>
      <h2>Candidate Profile</h2>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills" />
      <input
        value={experienceYears}
        onChange={(e) => setExperienceYears(e.target.value)}
        placeholder="Experience Years"
        type="number"
      />
      <input value={resumePath} onChange={(e) => setResumePath(e.target.value)} placeholder="Resume Path" />
      <div className="row">
        <button type="submit">Create Profile</button>
        <button type="button" onClick={onUpdate}>
          Update Profile
        </button>
      </div>
      {message && <p>{message}</p>}
    </form>
  );
}
