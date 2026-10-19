import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

export default function PasswordRecoveryPage({ reset = false }) {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError(''); setMessage('');
    if (reset && password !== confirmation) return setError('The passwords do not match.');
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password/${reset ? 'reset' : 'forgot'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reset ? { token: params.get('token'), password } : { email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not complete this request.');
      setMessage(data.message || 'Request complete.');
      setPassword(''); setConfirmation('');
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to Bazzar.');
    } finally { setBusy(false); }
  };

  return <main className="auth-master-universe"><section className="glass-card password-recovery-card">
    <span className="password-recovery-kicker">BAZZAR ACCOUNT</span>
    <h1>{reset ? 'Choose a new password' : 'Recover your account'}</h1>
    <p>{reset ? 'Set a new password for your account. Recovery links expire after 30 minutes.' : 'Enter the email address on your account and we’ll send a one-time recovery link.'}</p>
    <form onSubmit={submit} className="password-recovery-form">
      {!reset ? <label>Email address<input className="shiny-input" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label> : <><label>New password<input className="shiny-input" type="password" autoComplete="new-password" minLength="8" value={password} onChange={event => setPassword(event.target.value)} required /></label><label>Confirm new password<input className="shiny-input" type="password" autoComplete="new-password" minLength="8" value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label></>}
      {error && <p className="password-recovery-error" role="alert">{error}</p>}
      {message && <p className="password-recovery-success" role="status">{message}</p>}
      <button className="neon-btn" type="submit" disabled={busy}>{busy ? 'Please wait…' : reset ? 'Update password' : 'Send recovery link'}</button>
    </form>
    <Link to="/login" className="auth-recovery-link">Return to sign in</Link>
  </section></main>;
}
