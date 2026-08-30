// src/pages/CoursesPage.js
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api/courseApi';
import CourseForm from '../components/CourseForm';
import './CoursesPage.css';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    getCourses()
      .then((res) => setCourses(res.data))
      .catch(() => setError('Could not load courses. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCourseCreated = () => {
    setShowForm(false);
    load();
  };

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Manage Courses</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Course
          </button>
        )}
      </div>

      <div className="scroll-region">
        {showForm && (
          <CourseForm onCourseCreated={handleCourseCreated} onCancel={() => setShowForm(false)} />
        )}

        {courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
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