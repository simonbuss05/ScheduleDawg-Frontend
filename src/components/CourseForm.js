// src/components/CourseForm.js
import { useEffect, useRef, useState } from 'react';
import { createCourse } from '../api/courseApi';
import { createMeeting } from '../api/meetingApi';
import DayPicker from './DayPicker';
import TimePicker from './TimePicker';
import BuildingAutocomplete from './BuildingAutocomplete';
import './CourseForm.css';

let entryId = 0;
function newMeetingEntry() {
  return {
    key: entryId++,
    selectedDays: [],
    startTime: '09:00',
    endTime: '09:50',
    building: '',
    roomNumber: '',
  };
}

function CourseForm({ onCourseCreated, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    professor: '',
    creditHours: '',
  });
  const [meetingEntries, setMeetingEntries] = useState([newMeetingEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const errorRef = useRef(null);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' });
  }, [error]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateEntry = (key, updates) => {
    setMeetingEntries(meetingEntries.map((entry) =>
      entry.key === key ? { ...entry, ...updates } : entry
    ));
  };

  const addEntry = () => setMeetingEntries([...meetingEntries, newMeetingEntry()]);
  const removeEntry = (key) => setMeetingEntries(meetingEntries.filter((e) => e.key !== key));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.code.trim() || !form.professor.trim()) {
      setError('Name, code, and professor are required.');
      return;
    }
    const credits = Number(form.creditHours);
    if (form.creditHours === '' || isNaN(credits) || credits <= 0 || credits > 12) {
      setError('Credit hours must be a number between 1 and 12.');
      return;
    }

    const entriesWithDaysOrBuilding = meetingEntries.filter(
      (entry) => entry.selectedDays.length > 0 || entry.building.trim()
    );
    for (const entry of entriesWithDaysOrBuilding) {
      if (entry.selectedDays.length === 0) {
        setError('Every meeting time needs at least one day selected.');
        return;
      }
      if (!entry.building.trim()) {
        setError('Every meeting time needs a building.');
        return;
      }
      if (entry.endTime <= entry.startTime) {
        setError('Each meeting\'s end time must be after its start time.');
        return;
      }
    }

    setSubmitting(true);

    createCourse({ ...form, creditHours: credits })
      .then((courseRes) => {
        const newCourse = courseRes.data;

        const validEntries = meetingEntries.filter(
          (entry) => entry.selectedDays.length > 0 && entry.building.trim()
        );

        const meetingCreations = validEntries.flatMap((entry) =>
          entry.selectedDays.map((day) =>
            createMeeting(newCourse.id, {
              dayOfWeek: day,
              startTime: entry.startTime,
              endTime: entry.endTime,
              building: entry.building,
              roomNumber: entry.roomNumber,
            })
          )
        );

        return Promise.all(meetingCreations).then(() => onCourseCreated(newCourse));
      })
      .catch(() => setError('Could not create course. Check your inputs and try again.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <form className="course-form" onSubmit={handleSubmit}>
      <h3>Add a Course</h3>
      {error && <p className="error" ref={errorRef}>{error}</p>}

      <label>
        Course Name
        <input name="name" value={form.name} onChange={handleChange} required />
      </label>

      <label>
        Course Code
<input name="code" value={form.code} onChange={handleChange} placeholder="Ex. CSCI 2720" required />      </label>

      <label>
        Professor
        <input name="professor" value={form.professor} onChange={handleChange} required />
      </label>

      <label>
        Credit Hours
        <input
          name="creditHours"
          type="number"
          value={form.creditHours}
          onChange={handleChange}
          min="1"
          max="12"
          required
        />
      </label>

      <div className="meeting-entries">
        <p className="meeting-entries-title">Meeting Times (optional)</p>
        {meetingEntries.map((entry) => (
          <div key={entry.key} className="meeting-entry">
            <label>
              Days
              <DayPicker
                selectedDays={entry.selectedDays}
                onChange={(days) => updateEntry(entry.key, { selectedDays: days })}
              />
            </label>
            <div className="time-row">
              <label>
                Start
                <TimePicker
                  value={entry.startTime}
                  onChange={(t) => updateEntry(entry.key, { startTime: t })}
                />
              </label>
              <label>
                End
                <TimePicker
                  value={entry.endTime}
                  onChange={(t) => updateEntry(entry.key, { endTime: t })}
                />
              </label>
            </div>
            <div className="time-row">
              <label>
                Building
                <BuildingAutocomplete
  value={entry.building}
  onChange={(val) => updateEntry(entry.key, { building: val })}
  placeholder="Building Name"
/>
              </label>
              <label>
                Room
                <input
  value={entry.roomNumber}
  onChange={(e) => updateEntry(entry.key, { roomNumber: e.target.value })}
  placeholder="Room Number"
/>
              </label>
            </div>
            {meetingEntries.length > 1 && (
              <button type="button" className="remove-entry-btn" onClick={() => removeEntry(entry.key)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={addEntry}>
          + Add Another Meeting Time
        </button>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Course'}
        </button>
      </div>
    </form>
  );
}

export default CourseForm;