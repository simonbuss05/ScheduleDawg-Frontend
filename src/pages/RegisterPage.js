// src/pages/RegisterPage.js
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    register(email, password)
      .then(() => navigate('/'))
      .catch((err) => setError(err.response?.data?.message || 'Could not create your account.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-logo">ScheduleDawg</h1>
        <h2 className="auth-title">Create your account</h2>
        {error && <p className="error">{error}</p>}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>

        <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
