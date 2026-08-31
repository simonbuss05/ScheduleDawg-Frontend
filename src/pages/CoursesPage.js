// src/pages/CoursesPage.js
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCourses } from '../api/courseApi';
import { getSemesters } from '../api/semesterApi';
import { getCourseColor } from '../utils/courseColor';
import CourseForm from '../components/CourseForm';
import './CoursesPage.css';

function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const semesterId = searchParams.get('semesterId');

  const [courses, setCourses] = useState([]);
  const [viewingSemester, setViewingSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([getCourses(semesterId), getSemesters()])
      .then(([coursesRes, semestersRes]) => {
        setCourses(coursesRes.data);
        if (semesterId) {
          const match = semestersRes.data.find((s) => String(s.id) === semesterId);
          setViewingSemester(match && !match.active ? match : null);
        } else {
          setViewingSemester(null);
        }
      })
      .catch(() => setError('Could not load courses. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterId]);

  const handleCourseCreated = () => {
    setShowForm(false);
    load();
  };

  if (loading) return <p>Loading courses...</p>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Manage Courses</h2>
        {!showForm && !viewingSemester && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Course
          </button>
        )}
      </div>

      {error && (
        <div className="load-error-banner">
          <span>{error}</span>
          <button className="btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      {viewingSemester && (
        <div className="archived-semester-banner">
          <span>Viewing an archived semester: <strong>{viewingSemester.name}</strong></span>
          <button className="btn-secondary" onClick={() => setSearchParams({})}>Back to current semester</button>
        </div>
      )}

      <div className="scroll-region">
        {showForm && (
          <CourseForm onCourseCreated={handleCourseCreated} onCancel={() => setShowForm(false)} />
        )}

        {courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <Link
                to={`/courses/${course.id}`}
                key={course.id}
                className="course-card"
                style={{ '--course-color': getCourseColor(course.id) }}
              >
                <div className="course-card-top">
                  <h3>{course.name}</h3>
                  <span className="course-card-chevron">&rsaquo;</span>
                </div>
                <p className="course-code-sub">{course.code}</p>
                <p className="course-professor">{course.professor}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoursesPage;
