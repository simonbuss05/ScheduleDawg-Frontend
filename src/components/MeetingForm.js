// src/components/MeetingForm.js
import { useState } from 'react';
import { createMeeting } from '../api/meetingApi';
import DayPicker from './DayPicker';
import TimePicker from './TimePicker';
import './MeetingForm.css';

function MeetingForm({ courseId, onCreated, onCancel }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:50');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (selectedDays.length === 0) {
      setError('Select at least one day.');
      return;
    }
    if (!location.trim()) {
      setError('Location is required.');
      return;
    }

    setSubmitting(true);
    Promise.all(
      selectedDays.map((day) =>
        createMeeting(courseId, { dayOfWeek: day, startTime, endTime, location })
      )
    )
      .then((responses) => onCreated(responses.map((res) => res.data)))
      .catch(() => setError('Could not add meeting(s). Check the fields and try again.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <form className="meeting-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <label>
        Days
        <DayPicker selectedDays={selectedDays} onChange={setSelectedDays} />
      </label>

      <div className="time-row">
        <label>
          Start Time
          <TimePicker value={startTime} onChange={setStartTime} />
        </label>
        <label>
          End Time
          <TimePicker value={endTime} onChange={setEndTime} />
        </label>
      </div>

      <label>
        Location
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="MLC 148" />
      </label>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Meeting'}
        </button>
      </div>
    </form>
  );
}

export default MeetingForm;