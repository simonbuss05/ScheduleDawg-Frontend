// src/components/MeetingEditForm.js
import { useState } from 'react';
import { updateMeeting } from '../api/meetingApi';
import BuildingAutocomplete from './BuildingAutocomplete';
import './MeetingForm.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

function MeetingEditForm({ courseId, meeting, onSaved, onCancel }) {
  const [dayOfWeek, setDayOfWeek] = useState(meeting.dayOfWeek);
  const [startTime, setStartTime] = useState(meeting.startTime.slice(0, 5));
  const [endTime, setEndTime] = useState(meeting.endTime.slice(0, 5));
  const [building, setBuilding] = useState(meeting.building || '');
  const [roomNumber, setRoomNumber] = useState(meeting.roomNumber || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!building.trim()) {
      setError('Building is required.');
      return;
    }

    setSubmitting(true);
    updateMeeting(courseId, meeting.id, { dayOfWeek, startTime, endTime, building, roomNumber })
      .then((res) => onSaved(res.data))
      .catch(() => setError('Could not save changes. Try again.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <form className="meeting-form meeting-edit-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <label>
        Day
        <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
          {DAYS.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </label>

      <div className="time-row">
        <label>
          Start Time
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label>
          End Time
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>

      <div className="time-row">
        <label>
          Building
          <BuildingAutocomplete value={building} onChange={setBuilding} placeholder="Boyd" />
        </label>
        <label>
          Room
          <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="0322" />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default MeetingEditForm;