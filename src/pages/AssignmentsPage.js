// src/pages/AssignmentsPage.js
import { useEffect, useState } from 'react';
import { getCourses } from '../api/courseApi';
import { getAssignments, updateAssignment, deleteAssignment } from '../api/assignmentApi';
import { formatDateWithWeekday, isThisWeek } from '../utils/dateUtils';
import AssignmentForm from '../components/AssignmentForm';
import './AssignmentsPage.css';

function AssignmentsPage() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const load = () => {
    setLoading(true);
    getCourses().then((coursesRes) => {
      const courseList = coursesRes.data;
      setCourses(courseList);
      return Promise.all(courseList.map((c) => getAssignments(c.id))).then((responses) => {
        const combined = responses.flatMap((res, i) =>
          res.data.map((a) => ({ ...a, course: courseList[i] }))
        );
        setAssignments(combined);
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleComplete = (assignment) => {
    const updated = { ...assignment, completed: !assignment.completed };
    updateAssignment(assignment.course.id, assignment.id, updated).then(() => {
      setAssignments(assignments.map((a) => (a.id === assignment.id ? updated : a)));
    });
  };

  const handleDelete = (assignment) => {
    deleteAssignment(assignment.course.id, assignment.id).then(() => {
      setAssignments(assignments.filter((a) => a.id !== assignment.id));
    });
  };

  const handleCreated = () => {
    setShowForm(false);
    setSelectedCourseId('');
    load();
  };

  if (loading) return <p>Loading assignments...</p>;

  const selectedCourse = courses.find((c) => String(c.id) === selectedCourseId);

  const byDueDate = (a, b) => a.dueDate.localeCompare(b.dueDate);

  const thisWeek = assignments
    .filter((a) => !a.completed && isThisWeek(a.dueDate))
    .sort(byDueDate);

  const upcoming = assignments
    .filter((a) => !a.completed && !isThisWeek(a.dueDate))
    .sort(byDueDate);

  const completed = assignments
    .filter((a) => a.completed)
    .sort(byDueDate);

  const renderRow = (a) => (
    <li key={a.id} className={`assignment-full-row ${a.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={!!a.completed}
        onChange={() => handleToggleComplete(a)}
      />
      <div className="cell-course">
        <span className="cell-course-name">{a.course.name}</span>
        <span className="cell-course-code">{a.course.code}</span>
      </div>
      <span className="assignment-title">{a.title}</span>
      <span className="assignment-due">{formatDateWithWeekday(a.dueDate)}</span>
      <button className="btn-danger" onClick={() => handleDelete(a)}>Delete</button>
    </li>
  );

  const tableHeader = (
    <div className="assignment-table-header">
      <span></span>
      <span>Course</span>
      <span>Assignment</span>
      <span>Due Date</span>
      <span></span>
    </div>
  );

  const renderTable = (list, emptyMessage) => (
    <div className="assignment-table">
      {tableHeader}
      {list.length === 0 ? (
        <p className="table-empty-state">{emptyMessage}</p>
      ) : (
        <ul className="assignment-full-list">
          {list.map(renderRow)}
        </ul>
      )}
    </div>
  );

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Assignments</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Assignment
          </button>
        )}
      </div>

      {showForm && (
        <div className="new-assignment-panel">
          <label>
            Course
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </label>

          {selectedCourse && (
            <AssignmentForm
              courseId={selectedCourse.id}
              onCreated={handleCreated}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      <div className="scroll-region">
        <h3 className="section-label">This Week</h3>
        {renderTable(thisWeek, 'Nothing due this week.')}

        <h3 className="section-label">Upcoming</h3>
        {renderTable(upcoming, 'Nothing further out.')}

        <h3 className="section-label">Completed</h3>
        {renderTable(completed, 'No completed assignments yet.')}
      </div>
    </div>
  );
}

export default AssignmentsPage;