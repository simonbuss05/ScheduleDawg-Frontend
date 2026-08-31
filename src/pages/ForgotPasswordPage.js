// src/pages/ForgotPasswordPage.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/authApi';
import './AuthPage.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Always show the same "check your email" message regardless of whether
    // the request actually succeeded or the address is registered — the
    // backend deliberately behaves the same way either way.
    forgotPassword(email)
      .catch(() => {})
      .finally(() => {
        setSubmitting(false);
        setSent(true);
      });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">ScheduleDawg</h1>
        <h2 className="auth-title">Reset your password</h2>

        {sent ? (
          <p className="auth-body">
            If an account exists for <strong>{email}</strong>, we've sent a link to reset your
            password. It expires in 30 minutes.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="auth-body">
              Enter the email on your account and we'll send you a link to reset your password.
            </p>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">&larr; Back to log in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
