// src/pages/CourseDetailPage.js
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourseById, deleteCourse } from '../api/courseApi';
import { getMeetings, deleteMeeting } from '../api/meetingApi';
import { getAssignments, deleteAssignment } from '../api/assignmentApi';
import MeetingForm from '../components/MeetingForm';
import AssignmentForm from '../components/AssignmentForm';
import MeetingRow from '../components/MeetingRow';
import EventsSection from '../components/EventsSection';
import './CourseDetailPage.css';

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      getCourseById(courseId),
      getMeetings(courseId),
      getAssignments(courseId),
    ])
      .then(([courseRes, meetingsRes, assignmentsRes]) => {
        setCourse(courseRes.data);
        setMeetings(meetingsRes.data);
        setAssignments(assignmentsRes.data);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleDeleteMeeting = (meetingId) => {
    deleteMeeting(courseId, meetingId).then(() => {
      setMeetings(meetings.filter((m) => m.id !== meetingId));
    });
  };

  const handleDeleteAssignment = (assignmentId) => {
    deleteAssignment(courseId, assignmentId).then(() => {
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    });
  };

  const handleDeleteCourse = () => {
    const confirmed = window.confirm(
      `Delete ${course.code}? This will also remove all its meetings, assignments, and events.`
    );
    if (!confirmed) return;

    setDeleting(true);
    deleteCourse(courseId)
      .then(() => navigate('/'))
      .catch(() => {
        setDeleting(false);
        window.alert('Could not delete course. Try again.');
      });
  };

  if (loading) return <p>Loading course...</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div>
      <Link to="/" className="back-link">&larr; All Courses</Link>
      <div className="course-header">
        <div>
          <h2>{course.code} — {course.name}</h2>
          <p className="course-professor">{course.professor}</p>
        </div>
        <button className="btn-danger" onClick={handleDeleteCourse} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete Course'}
        </button>
      </div>

      <section className="detail-section">
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
            {meetings.map((m) => (
              <MeetingRow key={m.id} meeting={m} onDeleteMeeting={handleDeleteMeeting} />
            ))}
          </ul>
        )}
      </section>

      {meetings.length > 0 && <EventsSection meetings={meetings} />}

      <section className="detail-section">
        <div className="section-header">
          <h3>Assignments</h3>
          <button className="btn-primary" onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
            {showAssignmentForm ? 'Cancel' : '+ Add Assignment'}
          </button>
        </div>

        {showAssignmentForm && (
          <AssignmentForm
            courseId={courseId}
            onCreated={(a) => {
              setAssignments([...assignments, a]);
              setShowAssignmentForm(false);
            }}
            onCancel={() => setShowAssignmentForm(false)}
          />
        )}

        {assignments.length === 0 ? (
          <p className="empty-state">No assignments yet.</p>
        ) : (
          <ul className="assignment-list">
            {assignments.map((a) => (
              <li key={a.id} className="assignment-row">
                <span>{a.title}</span>
                <span>{a.dueDate}</span>
                <button className="btn-danger" onClick={() => handleDeleteAssignment(a.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default CourseDetailPage;