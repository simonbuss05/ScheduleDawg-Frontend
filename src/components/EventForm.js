// src/components/EventForm.js
import { useState } from 'react';
import './EventForm.css';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function EventForm({ meetings, onCreated, onCancel, createEventFn }) {
  const todayString = getTodayString();

  const [form, setForm] = useState({
    title: '',
    description: '',
    eventDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (form.eventDate < todayString) {
      setError('Event date cannot be in the past.');
      return;
    }

    const [year, month, day] = form.eventDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const weekday = DAY_NAMES[selectedDate.getDay()];

    const matchingMeeting = meetings.find((m) => m.dayOfWeek === weekday);

    if (!matchingMeeting) {
      setError(`This course doesn't meet on a ${weekday.toLowerCase()}.`);
      return;
    }

    setSubmitting(true);
    createEventFn(matchingMeeting.id, {
      title: form.title,
      description: form.description,
      eventDate: form.eventDate,
    })
      .then((res) => onCreated(res.data, matchingMeeting))
      .catch(() => setError('Could not add event. Try again.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <label>
        Title
        <input name="title" value={form.title} onChange={handleChange} placeholder="Ex. Test 2" required />
      </label>

      <label>
        Description
        <input name="description" value={form.description} onChange={handleChange} />
      </label>

      <label>
        Date
        <input
          type="date"
          name="eventDate"
          value={form.eventDate}
          onChange={handleChange}
          min={todayString}
          required
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Event'}
        </button>
      </div>
    </form>
  );
}

export default EventForm;