// src/pages/SettingsPage.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings } from '../api/settingsApi';
import { changePassword, deleteAccount } from '../api/authApi';
import { geocodeAddress } from '../utils/geocoding';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useOnboarding } from '../context/OnboardingContext';
import './SettingsPage.css';

function combineAddress({ street, city, state, zip }) {
  return `${street}, ${city}, ${state} ${zip}`.trim();
}

function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { resumeIfAt } = useOnboarding();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getSettings().then((res) => {
      const saved = res.data.homeAddress || '';
      setResolvedAddress(saved);
      // Best-effort split of a previously saved single-line address
      // into the four fields, so editing shows something reasonable.
      const parts = saved.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        setStreet(parts[0] || '');
        setCity(parts[1] || '');
        const stateZip = (parts[2] || '').split(' ');
        setState(stateZip[0] || '');
        setZip(stateZip.slice(1).join(' ') || '');
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setError('Fill in all four fields.');
      return;
    }

    const fullAddress = combineAddress({ street, city, state, zip });

    setSaving(true);
    geocodeAddress(fullAddress)
      .then(({ lat, lng, placeName }) => {
        setResolvedAddress(placeName);
        return updateSettings({ homeAddress: fullAddress, homeLatitude: lat, homeLongitude: lng });
      })
      .then(() => {
        setSuccess(true);
        resumeIfAt('tour');
      })
      .catch(() => setError('Could not find that address. Double-check the fields and try again.'))
      .finally(() => setSaving(false));
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    changePassword(currentPassword, newPassword)
      .then(() => {
        // Changing the password invalidates every session, including this
        // one (see AuthService.changePassword / JwtAuthenticationFilter) —
        // the current token stops working on the very next request, so log
        // out proactively instead of leaving the page looking successful
        // right up until some other action mysteriously 401s.
        logout();
        navigate('/login', { state: { passwordChanged: true } });
      })
      .catch((err) => {
        setPasswordError(err.response?.data?.message || 'Could not change your password.');
        setChangingPassword(false);
      });
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError('Enter your password to confirm.');
      return;
    }

    const ok = await confirm({
      title: 'Delete your account?',
      message: 'This permanently deletes your account and everything in it — courses, assignments, events, grades, and syllabi. This cannot be undone.',
      confirmLabel: 'Delete Account',
    });
    if (!ok) return;

    setDeleting(true);
    deleteAccount(deletePassword)
      .then(() => {
        logout();
        navigate('/login');
      })
      .catch((err) => {
        setDeleteError(err.response?.data?.message || 'Could not delete your account.');
        setDeleting(false);
      });
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
      </div>

      <div className="scroll-region">
        <div className="settings-section">
          <h3>Home Address</h3>
          <p className="settings-description">
            Used to calculate walking directions to and from your first and last class of the day.
          </p>

          <form className="settings-form" onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">Address saved.</p>}

            <label>
              Street Address
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="123 Main St"
              />
            </label>

            <div className="address-row">
              <label className="city-field">
                City
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Athens"
                />
              </label>
              <label className="state-field">
                State
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="GA"
                  maxLength={2}
                />
              </label>
              <label className="zip-field">
                Zip Code
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="30601"
                />
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : resolvedAddress ? 'Update Address' : 'Save Address'}
            </button>
          </form>

          {resolvedAddress && (
            <div className="resolved-address">
              <span className="resolved-address-label">Matched location:</span>
              <span className="resolved-address-value">{resolvedAddress}</span>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3>Account</h3>
          {user?.email && (
            <p className="settings-description">
              Signed in as <strong>{user.email}</strong>.
            </p>
          )}

          <form className="settings-form" onSubmit={handleChangePassword}>
            {passwordError && <p className="error">{passwordError}</p>}
            {passwordSuccess && <p className="success">Password updated.</p>}

            <label>
              Current Password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <button type="submit" className="btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        <div className="settings-section danger-zone">
          <h3>Delete Account</h3>
          <p className="settings-description">
            Permanently deletes your account and everything in it — courses, assignments, events,
            grades, and syllabi. This cannot be undone.
          </p>

          <form className="settings-form" onSubmit={handleDeleteAccount}>
            {deleteError && <p className="error">{deleteError}</p>}

            <label>
              Password
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="btn-danger-solid" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
