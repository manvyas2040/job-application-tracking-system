import { FormEvent, useState } from 'react';
import { login } from '../api/auth';
import { setAccessToken } from '../api/client';

type Props = {
  onLoggedIn: () => void;
};

export default function LoginPage({ onLoggedIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await login({ email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setAccessToken(data.access_token);
      setMessage('Login successful');
      onLoggedIn();
    } catch {
      setMessage('Login failed. Check email/password or account status.');
    }
  };

  return (
    <form className="stack" onSubmit={onSubmit}>
      <h2>Login</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
      {message && <p>{message}</p>}
    </form>
  );
}
