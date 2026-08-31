// src/pages/ResetPasswordPage.js
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/authApi';
import './AuthPage.css';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    resetPassword(token, newPassword)
      .then(() => setDone(true))
      .catch((err) =>
        setError(err.response?.data?.message || 'Could not reset your password. Try requesting a new link.')
      )
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">ScheduleDawg</h1>
        <h2 className="auth-title">Set a new password</h2>

        {!token ? (
          <p className="error">
            This link is missing its reset token. Request a new one from the forgot-password page.
          </p>
        ) : done ? (
          <p className="auth-body">Your password has been reset. You can log in with it now.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Resetting...' : 'Reset password'}
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

export default ResetPasswordPage;
