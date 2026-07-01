import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthPage() {
  const [mode, setMode] = useState('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { data, error } = mode === 'sign_in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (mode === 'sign_up' && data && !data.session) {
        setMessage('Registration successful! Please check your email for a confirmation link.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="centered">
      <form onSubmit={submit} className="auth-card">
        <h1>QueueT</h1>
        <p className="auth-subtitle">
          {mode === 'sign_in' ? 'Sign in to your boards' : 'Create an account to get started'}
        </p>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="error-text" style={{ marginBottom: 10 }}>{error}</p>}
        {message && (
          <div style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-tint)', padding: '10px', borderRadius: 'var(--radius)', marginBottom: 10, fontSize: '13px', border: '1px solid var(--border)' }}>
            {message}
          </div>
        )}
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'sign_in' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            setError('');
            setMessage('');
            setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in');
          }}
        >
          {mode === 'sign_in' ? "Don't have an account? Sign up" : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
