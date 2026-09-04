// src/pages/CourseworkPage.js
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCourses } from '../api/courseApi';
import { getSemesters } from '../api/semesterApi';
import { getAssignments, updateAssignment, deleteAssignment } from '../api/assignmentApi';
import { getEvents, createEvent, deleteEvent } from '../api/eventApi';
import { formatDateWithWeekday, isPastDate, isThisWeek } from '../utils/dateUtils';
import { getCourseColor } from '../utils/courseColor';
import { useConfirm } from '../context/ConfirmContext';
import AssignmentForm from '../components/AssignmentForm';
import EventForm from '../components/EventForm';
import './CourseworkPage.css';

function CourseworkPage() {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const semesterId = searchParams.get('semesterId');

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [viewingSemester, setViewingSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [filterCourseId, setFilterCourseId] = useState('');

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentCourseId, setAssignmentCourseId] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventCourseId, setEventCourseId] = useState('');

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([getCourses(semesterId), getSemesters()])
      .then(([coursesRes, semestersRes]) => {
        const courseList = coursesRes.data;
        setCourses(courseList);
        if (semesterId) {
          const match = semestersRes.data.find((s) => String(s.id) === semesterId);
          setViewingSemester(match && !match.active ? match : null);
        } else {
          setViewingSemester(null);
        }

        return Promise.all([
          Promise.all(courseList.map((c) => getAssignments(c.id))),
          Promise.all(courseList.map((c) => getEvents(c.id))),
        ]).then(([assignmentResponses, eventResponses]) => {
          setAssignments(
            assignmentResponses.flatMap((res, i) =>
              res.data.map((a) => ({ ...a, course: courseList[i] }))
            )
          );
          setEvents(
            eventResponses.flatMap((res, i) =>
              res.data.map((ev) => ({ ...ev, course: courseList[i] }))
            )
          );
        });
      })
      .catch(() => setLoadError('Could not load your coursework. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const preselect = searchParams.get('courseId');
    if (preselect) setFilterCourseId(preselect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterId]);

  const handleToggleComplete = (assignment) => {
    const updated = { ...assignment, completed: !assignment.completed };
    updateAssignment(assignment.course.id, assignment.id, updated)
      .then(() => setAssignments(assignments.map((a) => (a.id === assignment.id ? updated : a))))
      .catch(() => setLoadError('Could not update that assignment. Try again.'));
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: `Delete this ${item.type}?`,
      message: `"${item.title}" will be removed.`,
    });
    if (!ok) return;

    if (item.type === 'assignment') {
      deleteAssignment(item.course.id, item.raw.id).then(() => {
        setAssignments(assignments.filter((a) => a.id !== item.raw.id));
      });
    } else {
      deleteEvent(item.course.id, item.raw.id).then(() => {
        setEvents(events.filter((e) => e.id !== item.raw.id));
      });
    }
  };

  const handleAssignmentCreated = () => {
    setShowAssignmentForm(false);
    setAssignmentCourseId('');
    load();
  };

  const handleEventCreated = () => {
    setShowEventForm(false);
    setEventCourseId('');
    load();
  };

  if (loading) return <p>Loading coursework...</p>;

  const selectedAssignmentCourse = courses.find((c) => String(c.id) === assignmentCourseId);
  const selectedEventCourse = courses.find((c) => String(c.id) === eventCourseId);
  const filteredCourse = courses.find((c) => String(c.id) === filterCourseId);

  const items = [
    ...assignments.map((a) => ({
      type: 'assignment',
      id: `a-${a.id}`,
      raw: a,
      course: a.course,
      title: a.title,
      date: a.dueDate,
      completed: a.completed,
    })),
    ...events.map((ev) => ({
      type: 'event',
      id: `e-${ev.id}`,
      raw: ev,
      course: ev.course,
      title: ev.title,
      date: ev.eventDate,
    })),
  ];

  const filtered = filterCourseId
    ? items.filter((i) => String(i.course.id) === filterCourseId)
    : items;

  const isDone = (item) => (item.type === 'event' ? isPastDate(item.date) : item.completed);
  const isOverdue = (item) => item.type === 'assignment' && !item.completed && isPastDate(item.date);
  const byDate = (a, b) => a.date.localeCompare(b.date);

  const active = filtered.filter((i) => !isDone(i));
  const overdue = active.filter(isOverdue).sort(byDate);
  const thisWeek = active.filter((i) => !isOverdue(i) && isThisWeek(i.date)).sort(byDate);
  const upcoming = active.filter((i) => !isOverdue(i) && !isThisWeek(i.date)).sort(byDate);
  const done = filtered.filter(isDone).sort((a, b) => b.date.localeCompare(a.date));

  const renderRow = (item) => (
    <li
      key={item.id}
      className={`coursework-row ${isDone(item) ? 'done' : ''} ${isOverdue(item) ? 'overdue' : ''}`}
      style={{ '--course-color': getCourseColor(item.course.id) }}
    >
      {item.type === 'assignment' ? (
        <input
          type="checkbox"
          checked={!!item.completed}
          onChange={() => handleToggleComplete(item.raw)}
          title="Mark complete"
        />
      ) : (
        <span className="coursework-event-dot" title="Event" />
      )}
      <Link to={`/courses/${item.course.id}`} className="cell-course">
        <span className="cell-course-name">{item.course.name}</span>
        <span className="cell-course-code">{item.course.code}</span>
      </Link>
      <span className="coursework-title">
        {item.title}
        <span className={`coursework-type-tag ${item.type}`}>
          {item.type === 'assignment' ? 'Assignment' : 'Event'}
        </span>
      </span>
      <span className="coursework-date">
        {formatDateWithWeekday(item.date)}
      </span>
      <button className="btn-danger" onClick={() => handleDelete(item)}>Delete</button>
    </li>
  );

  const tableHeader = (
    <div className="coursework-table-header">
      <span></span>
      <span>Course</span>
      <span>Title</span>
      <span>When</span>
      <span></span>
    </div>
  );

  const renderSection = (title, list, emptyMessage) => (
    <div className={`coursework-section ${list.length === 0 ? 'is-empty' : ''}`}>
      <h3 className="section-label">{title}</h3>
      <div className="coursework-table">
        {tableHeader}
        {list.length === 0 ? (
          <p className="table-empty-state">{emptyMessage}</p>
        ) : (
          <ul className="coursework-list">{list.map(renderRow)}</ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Coursework</h2>
        {!viewingSemester && (
          <div className="coursework-header-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowEventForm(false);
                setShowAssignmentForm(!showAssignmentForm);
              }}
            >
              {showAssignmentForm ? 'Cancel' : '+ Assignment'}
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setShowAssignmentForm(false);
                setShowEventForm(!showEventForm);
              }}
            >
              {showEventForm ? 'Cancel' : '+ Event'}
            </button>
          </div>
        )}
      </div>

      {loadError && (
        <div className="load-error-banner">
          <span>{loadError}</span>
          <button className="btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      {viewingSemester && (
        <div className="archived-semester-banner">
          <span>Viewing an archived semester: <strong>{viewingSemester.name}</strong></span>
          <button className="btn-secondary" onClick={() => setSearchParams({})}>Back to current semester</button>
        </div>
      )}

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
            <button className="filter-clear-btn" onClick={() => setFilterCourseId('')} aria-label="Clear course filter">×</button>
          </span>
        )}
      </div>

      {showAssignmentForm && (
        <div className="new-coursework-panel card">
          <label>
            Course
            <select value={assignmentCourseId} onChange={(e) => setAssignmentCourseId(e.target.value)}>
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </label>

          {selectedAssignmentCourse && (
            <AssignmentForm
              courseId={selectedAssignmentCourse.id}
              onCreated={handleAssignmentCreated}
              onCancel={() => setShowAssignmentForm(false)}
            />
          )}
        </div>
      )}

      {showEventForm && (
        <div className="new-coursework-panel card">
          <label>
            Course
            <select value={eventCourseId} onChange={(e) => setEventCourseId(e.target.value)}>
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </label>
          {selectedEventCourse && (
            <EventForm
              courseId={selectedEventCourse.id}
              createEventFn={createEvent}
              onCreated={handleEventCreated}
              onCancel={() => setShowEventForm(false)}
            />
          )}
        </div>
      )}

      <div className="scroll-region coursework-scroll-region">
        {overdue.length > 0 && renderSection('Overdue', overdue, '')}
        {renderSection('This Week', thisWeek, 'Nothing this week.')}
        {renderSection('Upcoming', upcoming, 'Nothing further out.')}
        {renderSection('Done', done, 'Nothing completed or past yet.')}
      </div>
    </div>
  );
}

export default CourseworkPage;
