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

  useEffect(() => {
    getCourses()
      .then((res) => setCourses(res.data))
      .catch(() => setError('Could not load courses. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleCourseCreated = (newCourse) => {
    setCourses([...courses, newCourse]);
    setShowForm(false);
  };

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Your Courses</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Course
          </button>
        )}
      </div>

      {showForm && (
        <CourseForm
          onCourseCreated={handleCourseCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {courses.length === 0 && !showForm ? (
        <p>No courses yet. Add your first one to get started.</p>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
              <h3>{course.code}</h3>
              <p className="course-name">{course.name}</p>
              <p className="course-professor">{course.professor}</p>
              <p className="course-hours">{course.creditHours} credit hours</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default CoursesPage;