import { useState } from 'react';
import { submitFeedback } from '../api/interviews';

export default function InterviewerDashboard() {
  const [interviewId, setInterviewId] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [rating, setRating] = useState('4');
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('hire');
  const [message, setMessage] = useState('');

  const onSubmit = async () => {
    try {
      await submitFeedback({
        interview_id: Number(interviewId),
        interviewer_id: Number(interviewerId),
        rating: Number(rating),
        comments,
        recommendation,
      });
      setMessage('Feedback submitted (write-once).');
    } catch {
      setMessage('Submit failed (assigned interviewer only / write-once).');
    }
  };

  return (
    <div className="stack">
      <h2>Interviewer Dashboard</h2>
      <input placeholder="Interview ID" value={interviewId} onChange={(e) => setInterviewId(e.target.value)} />
      <input placeholder="Interviewer User ID" value={interviewerId} onChange={(e) => setInterviewerId(e.target.value)} />
      <input placeholder="Rating 1-5" value={rating} onChange={(e) => setRating(e.target.value)} />
      <input placeholder="Recommendation" value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
      <input placeholder="Comments" value={comments} onChange={(e) => setComments(e.target.value)} />
      <button onClick={onSubmit}>Submit Feedback</button>
      {message && <p>{message}</p>}
    </div>
  );
}
