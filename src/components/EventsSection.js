// src/components/EventsSection.js
import { useEffect, useState } from 'react';
import { getEvents, createEvent, deleteEvent } from '../api/eventApi';
import { formatTime } from '../utils/time';
import EventForm from './EventForm';
import './EventsSection.css';

function EventsSection({ meetings }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (meetings.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(meetings.map((m) => getEvents(m.id)))
      .then((responses) => {
        const combined = responses.flatMap((res, i) =>
          res.data.map((ev) => ({ ...ev, meeting: meetings[i] }))
        );
        setEvents(combined);
      })
      .finally(() => setLoading(false));
  }, [meetings]);

  const handleCreated = (newEvent, meeting) => {
    setEvents([...events, { ...newEvent, meeting }]);
    setShowForm(false);
  };

  const handleDelete = (event) => {
    deleteEvent(event.meeting.id, event.id).then(() => {
      setEvents(events.filter((e) => e.id !== event.id));
    });
  };

  return (
    <section className="detail-section">
      <div className="section-header">
        <h3>Events</h3>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {showForm && (
        <EventForm
          meetings={meetings}
          createEventFn={createEvent}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p className="empty-state">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="empty-state">No events yet.</p>
      ) : (
        <ul className="event-list">
          {events.map((ev) => (
            <li key={ev.id} className="event-row">
              <span>{ev.title}</span>
              <span>{ev.eventDate}</span>
              <span className="event-time">
                {formatTime(ev.meeting.startTime)} – {formatTime(ev.meeting.endTime)}
              </span>
              <button className="btn-danger" onClick={() => handleDelete(ev)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default EventsSection;