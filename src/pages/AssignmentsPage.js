// src/pages/AssignmentsPage.js
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCourses } from '../api/courseApi';
import { getAssignments, updateAssignment, deleteAssignment } from '../api/assignmentApi';
import { formatDateWithWeekday } from '../utils/dateUtils';
import { useConfirm } from '../context/ConfirmContext';
import AssignmentForm from '../components/AssignmentForm';
import './AssignmentsPage.css';

function AssignmentsPage() {
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');

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
    const preselect = searchParams.get('courseId');
    if (preselect) setFilterCourseId(preselect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleComplete = (assignment) => {
    const updated = { ...assignment, completed: !assignment.completed };
    updateAssignment(assignment.course.id, assignment.id, updated).then(() => {
      setAssignments(assignments.map((a) => (a.id === assignment.id ? updated : a)));
    });
  };

  const handleDelete = async (assignment) => {
    const ok = await confirm({
      title: 'Delete this assignment?',
      message: `"${assignment.title}" will be removed.`,
    });
    if (!ok) return;
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
  const filteredCourse = courses.find((c) => String(c.id) === filterCourseId);

  const filtered = filterCourseId
    ? assignments.filter((a) => String(a.course.id) === filterCourseId)
    : assignments;

  const upcoming = filtered
    .filter((a) => !a.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const completed = filtered
    .filter((a) => a.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

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
        <div className="new-assignment-panel card">
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
        <h3 className="section-label">Upcoming</h3>
        <div className="assignment-table">
          {tableHeader}
          {upcoming.length === 0 ? (
            <p className="table-empty-state">Nothing upcoming.</p>
          ) : (
            <ul className="assignment-full-list">
              {upcoming.map(renderRow)}
            </ul>
          )}
        </div>

        <h3 className="section-label">Completed</h3>
        <div className="assignment-table">
          {tableHeader}
          {completed.length === 0 ? (
            <p className="table-empty-state">No completed assignments yet.</p>
          ) : (
            <ul className="assignment-full-list">
              {completed.map(renderRow)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentsPage;