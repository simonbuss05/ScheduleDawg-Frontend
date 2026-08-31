// src/pages/LoginPage.js
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    login(email, password)
      .then(() => navigate('/'))
      .catch((err) => setError(err.response?.data?.message || 'Could not log in.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-logo">ScheduleDawg</h1>
        <h2 className="auth-title">Log in</h2>
        {error && <p className="error">{error}</p>}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
