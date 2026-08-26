// src/pages/SettingsPage.js
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/settingsApi';
import { geocodeAddress } from '../utils/geocoding';
import './SettingsPage.css';

function combineAddress({ street, city, state, zip }) {
  return `${street}, ${city}, ${state} ${zip}`.trim();
}

function SettingsPage() {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
      </div>

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
    </div>
  );
}

export default SettingsPage;