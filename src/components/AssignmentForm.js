// src/components/AssignmentForm.js
import { useEffect, useRef, useState } from 'react';
import { createAssignment } from '../api/assignmentApi';
import './AssignmentForm.css';

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function AssignmentForm({ courseId, onCreated, onCancel }) {
  const todayString = getTodayString();

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const errorRef = useRef(null);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' });
  }, [error]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (form.dueDate < todayString) {
      setError('Due date cannot be in the past.');
      return;
    }

    setSubmitting(true);

    createAssignment(courseId, form)
      .then((res) => onCreated(res.data))
      .catch(() => setError('Could not add assignment. Check the fields and try again.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <form className="assignment-form" onSubmit={handleSubmit}>
      {error && <p className="error" ref={errorRef}>{error}</p>}

      <label>
        Title
        <input name="title" value={form.title} onChange={handleChange} placeholder="Homework 3" required />
      </label>

      <label>
        Description
        <input name="description" value={form.description} onChange={handleChange} />
      </label>

      <label>
        Due Date
        <input
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
          min={todayString}
          required
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Assignment'}
        </button>
      </div>
    </form>
  );
}

export default AssignmentForm;