// src/pages/EventsPage.js
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCourses } from '../api/courseApi';
import { getMeetings } from '../api/meetingApi';
import { getEvents, createEvent, deleteEvent } from '../api/eventApi';
import { formatTime } from '../utils/time';
import { formatDateWithWeekday, isPastDate, isThisWeek } from '../utils/dateUtils';
import { useConfirm } from '../context/ConfirmContext';
import EventForm from '../components/EventForm';
import './EventsPage.css';

function EventsPage() {
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [meetingsByCourse, setMeetingsByCourse] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');

  const load = () => {
    setLoading(true);
    getCourses().then((coursesRes) => {
      const courseList = coursesRes.data;
      setCourses(courseList);

      return Promise.all(courseList.map((c) => getMeetings(c.id))).then((meetingResponses) => {
        const meetingMap = {};
        courseList.forEach((c, i) => {
          meetingMap[c.id] = meetingResponses[i].data;
        });
        setMeetingsByCourse(meetingMap);

        const allMeetings = meetingResponses.flatMap((res, i) =>
          res.data.map((m) => ({ ...m, course: courseList[i] }))
        );

        return Promise.all(allMeetings.map((m) => getEvents(m.id))).then((eventResponses) => {
          const combined = eventResponses.flatMap((res, i) =>
            res.data.map((ev) => ({ ...ev, meeting: allMeetings[i] }))
          );
          setEvents(combined);
        });
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const preselect = searchParams.get('courseId');
    if (preselect) setFilterCourseId(preselect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (event) => {
    const ok = await confirm({
      title: 'Delete this event?',
      message: `"${event.title}" will be removed.`,
    });
    if (!ok) return;
    deleteEvent(event.meeting.id, event.id).then(() => {
      setEvents(events.filter((e) => e.id !== event.id));
    });
  };

  const handleCreated = () => {
    setShowForm(false);
    setSelectedCourseId('');
    load();
  };

  if (loading) return <p>Loading events...</p>;

  const selectedMeetings = meetingsByCourse[selectedCourseId] || [];
  const filteredCourse = courses.find((c) => String(c.id) === filterCourseId);

  const filtered = filterCourseId
    ? events.filter((ev) => String(ev.meeting.course.id) === filterCourseId)
    : events;

  const byDate = (a, b) => a.eventDate.localeCompare(b.eventDate);

  const thisWeek = filtered
    .filter((ev) => !isPastDate(ev.eventDate) && isThisWeek(ev.eventDate))
    .sort(byDate);

  const upcoming = filtered
    .filter((ev) => !isPastDate(ev.eventDate) && !isThisWeek(ev.eventDate))
    .sort(byDate);

  const past = filtered
    .filter((ev) => isPastDate(ev.eventDate))
    .sort(byDate);

  const renderRow = (ev) => (
    <li
      key={ev.id}
      className={`event-full-row ${isPastDate(ev.eventDate) ? 'past' : ''}`}
    >
      <div className="cell-course">
        <span className="cell-course-name">{ev.meeting.course.name}</span>
        <span className="cell-course-code">{ev.meeting.course.code}</span>
      </div>
      <span className="event-title">{ev.title}</span>
      <span className="event-date">{formatDateWithWeekday(ev.eventDate)}</span>
      <span className="event-time">
        {formatTime(ev.meeting.startTime)} – {formatTime(ev.meeting.endTime)}
      </span>
      <button className="btn-danger" onClick={() => handleDelete(ev)}>Delete</button>
    </li>
  );

  const tableHeader = (
    <div className="event-table-header">
      <span>Course</span>
      <span>Event</span>
      <span>Date</span>
      <span>Time</span>
      <span></span>
    </div>
  );

  const renderTable = (list, emptyMessage) => (
    <div className="event-table">
      {tableHeader}
      {list.length === 0 ? (
        <p className="table-empty-state">{emptyMessage}</p>
      ) : (
        <ul className="event-full-list">
          {list.map(renderRow)}
        </ul>
      )}
    </div>
  );

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Events</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Event
          </button>
        )}
      </div>

      <div className="filter-row">
        <label className="filter-label">
          Showing
          <select value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </label>
        {filteredCourse && (
          <span className="filter-active-chip">
            Filtered to {filteredCourse.code}
            <button className="filter-clear-btn" onClick={() => setFilterCourseId('')}>×</button>
          </span>
        )}
      </div>

      {showForm && (
        <div className="new-event-panel card">
          <label>
            Course
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </label>

          {selectedCourseId && (
            <EventForm
              meetings={selectedMeetings}
              createEventFn={createEvent}
              onCreated={handleCreated}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      <div className="scroll-region">
        <h3 className="section-label">This Week</h3>
        {renderTable(thisWeek, 'Nothing this week.')}

        <h3 className="section-label">Upcoming</h3>
        {renderTable(upcoming, 'Nothing further out.')}

        <h3 className="section-label">Past</h3>
        {renderTable(past, 'No past events.')}
      </div>
    </div>
  );
}

export default EventsPage;