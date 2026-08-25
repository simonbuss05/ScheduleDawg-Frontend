// src/pages/CourseDetailPage.js
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, deleteCourse } from '../api/courseApi';
import { getMeetings, deleteMeeting } from '../api/meetingApi';
import MeetingForm from '../components/MeetingForm';
import MeetingRow from '../components/MeetingRow';
import './CourseDetailPage.css';

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([getCourseById(courseId), getMeetings(courseId)])
      .then(([courseRes, meetingsRes]) => {
        setCourse(courseRes.data);
        setMeetings(meetingsRes.data);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleDeleteMeeting = (meetingId) => {
    deleteMeeting(courseId, meetingId).then(() => {
      setMeetings(meetings.filter((m) => m.id !== meetingId));
    });
  };

  const handleDeleteCourse = () => {
    const confirmed = window.confirm(
      `Delete ${course.code}? This will also remove all its meetings, assignments, and events.`
    );
    if (!confirmed) return;

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

  return (
    <div className="page-shell">
      <div className="fixed-top">
        <button className="back-link" onClick={() => navigate(-1)}>&larr; Back</button>
        <div className="course-header">
          <div>
            <h2>{course.code} — {course.name}</h2>
            <p className="course-professor">{course.professor}</p>
          </div>
          <button className="btn-danger" onClick={handleDeleteCourse} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Course'}
          </button>
        </div>

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
      </div>

      <div className="scroll-region">
        {meetings.length === 0 ? (
          <p className="empty-state">No meetings yet.</p>
        ) : (
          <ul className="meeting-list">
            {meetings.map((m) => (
              <MeetingRow key={m.id} meeting={m} onDeleteMeeting={handleDeleteMeeting} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CourseDetailPage;