// src/pages/SettingsPage.js
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/settingsApi';
import { changePassword } from '../api/authApi';
import { geocodeAddress } from '../utils/geocoding';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

function combineAddress({ street, city, state, zip }) {
  return `${street}, ${city}, ${state} ${zip}`.trim();
}

function SettingsPage() {
  const { user } = useAuth();
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
      .then(() => setSuccess(true))
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
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((err) => setPasswordError(err.response?.data?.message || 'Could not change your password.'))
      .finally(() => setChangingPassword(false));
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
      </div>
    </div>
  );
}

export default SettingsPage;
