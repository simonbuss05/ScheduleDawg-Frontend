// src/pages/CourseDetailPage.js
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, GraduationCap } from 'lucide-react';
import { getCourseById, deleteCourse } from '../api/courseApi';
import { getMeetings, deleteMeeting } from '../api/meetingApi';
import { getAssignments, deleteAssignment } from '../api/assignmentApi';
import { getEvents, createEvent, deleteEvent } from '../api/eventApi';
import { getSyllabiByCourse, getSyllabusFile } from '../api/syllabusApi';
import { formatDateWithWeekday } from '../utils/dateUtils';
import { formatTime } from '../utils/time';
import { getCourseColor } from '../utils/courseColor';
import { useConfirm } from '../context/ConfirmContext';
import MeetingForm from '../components/MeetingForm';
import MeetingRow from '../components/MeetingRow';
import AssignmentForm from '../components/AssignmentForm';
import EventForm from '../components/EventForm';
import CourseGradeSummary from '../components/CourseGradeSummary';
import './CourseDetailPage.css';

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [course, setCourse] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [viewingSyllabus, setViewingSyllabus] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!viewingSyllabus || syllabi.length === 0) return undefined;
    let objectUrl;
    getSyllabusFile(syllabi[0].id).then((res) => {
      objectUrl = URL.createObjectURL(res.data);
      setPdfUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfUrl(null);
    };
  }, [viewingSyllabus, syllabi]);

  const loadEvents = (meetingList) => {
    if (meetingList.length === 0) return Promise.resolve([]);
    return Promise.all(meetingList.map((m) => getEvents(m.id))).then((responses) =>
      responses.flatMap((res, i) => res.data.map((ev) => ({ ...ev, meeting: meetingList[i] })))
    );
  };

  useEffect(() => {
    Promise.all([
      getCourseById(courseId),
      getMeetings(courseId),
      getAssignments(courseId),
      getSyllabiByCourse(courseId),
    ]).then(([courseRes, meetingsRes, assignmentsRes, syllabiRes]) => {
      setCourse(courseRes.data);
      setMeetings(meetingsRes.data);
      setAssignments(assignmentsRes.data);
      setSyllabi(syllabiRes.data);
      loadEvents(meetingsRes.data).then((evs) => {
        setEvents(evs);
        setLoading(false);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleDeleteMeeting = async (meetingId, meetingLabel) => {
    const ok = await confirm({
      title: 'Delete this meeting?',
      message: meetingLabel ? `${meetingLabel} will be removed.` : 'This cannot be undone.',
    });
    if (!ok) return;
    deleteMeeting(courseId, meetingId).then(() => {
      const remaining = meetings.filter((m) => m.id !== meetingId);
      setMeetings(remaining);
      setEvents(events.filter((ev) => ev.meeting.id !== meetingId));
    });
  };

  const handleMeetingUpdated = (updatedMeeting) => {
    setMeetings(meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
  };

  const handleAssignmentCreated = (assignment) => {
    setAssignments([...assignments, assignment]);
    setShowAssignmentForm(false);
  };

  const handleDeleteAssignment = async (assignment) => {
    const ok = await confirm({
      title: 'Delete this assignment?',
      message: `"${assignment.title}" will be removed.`,
    });
    if (!ok) return;
    deleteAssignment(courseId, assignment.id).then(() => {
      setAssignments(assignments.filter((a) => a.id !== assignment.id));
    });
  };

  const handleEventCreated = (event, meeting) => {
    setEvents([...events, { ...event, meeting }]);
    setShowEventForm(false);
  };

  const handleDeleteEvent = async (event) => {
    const ok = await confirm({
      title: 'Delete this event?',
      message: `"${event.title}" will be removed.`,
    });
    if (!ok) return;
    deleteEvent(event.meeting.id, event.id).then(() => {
      setEvents(events.filter((e) => e.id !== event.id));
    });
  };

  const handleDeleteCourse = async () => {
    const ok = await confirm({
      title: `Delete ${course.code}?`,
      message: 'This will also remove all its meetings, assignments, and events.',
    });
    if (!ok) return;

    setDeleting(true);
    deleteCourse(courseId)
      .then(() => navigate('/courses'))
      .catch(() => {
        setDeleting(false);
        window.alert('Could not delete course. Try again.');
      });
  };

  if (loading) return <p>Loading course...</p>;
  if (!course) return <p>Course not found.</p>;

  const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const sortedMeetings = [...meetings].sort(
  (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
);
  const hasSyllabus = syllabi.length > 0;
  const sortedAssignments = [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const sortedEvents = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return (
    <div className="page-shell" style={{ '--course-color': getCourseColor(courseId) }}>
      <div className="fixed-top">
        <button className="back-link" onClick={() => navigate(-1)}>&larr; Back</button>
        <div className="course-header">
          <div>
            <h2>{course.name}</h2>
            <p className="course-sub">{course.code} · {course.professor}</p>
          </div>
          <button className="btn-danger" onClick={handleDeleteCourse} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Course'}
          </button>
        </div>

        <div className="hub-stats-row">
          <div className="hub-stat-card">
            <div className="hub-stat-header">
              <GraduationCap size={15} />
              <span>Grade</span>
            </div>
            <CourseGradeSummary courseId={courseId} />
            <button
              className="hub-stat-link"
              onClick={() => navigate(`/grades?courseId=${courseId}`)}
            >
              View Grades &rsaquo;
            </button>
          </div>

          <div className="hub-stat-card">
            <div className="hub-stat-header">
              <FileText size={15} />
              <span>Syllabus</span>
            </div>
            {hasSyllabus ? (
              <>
                <span className="hub-stat-value">{syllabi[0].fileName}</span>
                <button className="hub-stat-link" onClick={() => setViewingSyllabus(true)}>
                  View &rsaquo;
                </button>
              </>
            ) : (
              <>
                <span className="hub-stat-empty">None uploaded</span>
                <button
                  className="hub-stat-link"
                  onClick={() => navigate(`/syllabus?courseId=${courseId}`)}
                >
                  Add Syllabus &rsaquo;
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="scroll-region">
        <section className="card hub-section">
          <div className="section-header">
            <h3>Meetings</h3>
            <button className="btn-primary" onClick={() => setShowMeetingForm(!showMeetingForm)}>
              {showMeetingForm ? 'Cancel' : '+ Add Meeting'}
            </button>
          </div>

          {showMeetingForm && (
            <MeetingForm
              courseId={courseId}
              onCreated={(newMeetings) => {
                setMeetings([...meetings, ...newMeetings]);
                setShowMeetingForm(false);
              }}
              onCancel={() => setShowMeetingForm(false)}
            />
          )}

          {meetings.length === 0 ? (
  <p className="empty-state">No meetings yet.</p>
) : (
  <ul className="meeting-list">
    {sortedMeetings.map((m) => (
                <MeetingRow
                  key={m.id}
                  meeting={m}
                  courseId={courseId}
                  onDeleteMeeting={handleDeleteMeeting}
                  onMeetingUpdated={handleMeetingUpdated}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="card hub-section">
          <div className="section-header">
            <h3>Assignments</h3>
            <button className="btn-primary" onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
              {showAssignmentForm ? 'Cancel' : '+ Add Assignment'}
            </button>
          </div>

          {showAssignmentForm && (
            <AssignmentForm
              courseId={courseId}
              onCreated={handleAssignmentCreated}
              onCancel={() => setShowAssignmentForm(false)}
            />
          )}

          {sortedAssignments.length === 0 ? (
            <p className="empty-state">No assignments yet.</p>
          ) : (
            <ul className="hub-list">
              {sortedAssignments.map((a) => (
                <li key={a.id} className="hub-list-row">
                  <span className="hub-list-title">{a.title}</span>
                  <span className="hub-list-date">{formatDateWithWeekday(a.dueDate)}</span>
                  <button className="icon-btn" onClick={() => handleDeleteAssignment(a)} title="Delete">×</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card hub-section">
          <div className="section-header">
            <h3>Events</h3>
            <button
              className="btn-primary"
              onClick={() => setShowEventForm(!showEventForm)}
              disabled={meetings.length === 0}
              title={meetings.length === 0 ? 'Add a meeting first' : undefined}
            >
              {showEventForm ? 'Cancel' : '+ Add Event'}
            </button>
          </div>

          {meetings.length === 0 && (
            <p className="empty-state">Add a meeting first — events attach to a class day.</p>
          )}

          {showEventForm && (
            <EventForm
              meetings={meetings}
              createEventFn={createEvent}
              onCreated={handleEventCreated}
              onCancel={() => setShowEventForm(false)}
            />
          )}

          {sortedEvents.length === 0 ? (
            meetings.length > 0 && <p className="empty-state">No events yet.</p>
          ) : (
            <ul className="hub-list">
              {sortedEvents.map((ev) => (
                <li key={ev.id} className="hub-list-row">
                  <span className="hub-list-title">{ev.title}</span>
                  <span className="hub-list-date">
                    {formatDateWithWeekday(ev.eventDate)} · {formatTime(ev.meeting.startTime)}
                  </span>
                  <button className="icon-btn" onClick={() => handleDeleteEvent(ev)} title="Delete">×</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {viewingSyllabus && hasSyllabus && (
        <div className="pdf-modal-overlay" onClick={() => setViewingSyllabus(false)}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <span>{syllabi[0].fileName}</span>
              <button className="btn-secondary" onClick={() => setViewingSyllabus(false)}>Close</button>
            </div>
            {pdfUrl ? (
              <iframe title="Syllabus PDF" src={pdfUrl} className="pdf-iframe" />
            ) : (
              <p className="empty-state">Loading…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetailPage;