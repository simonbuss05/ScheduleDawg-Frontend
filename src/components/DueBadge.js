// src/components/DueBadge.js
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourseColor } from '../utils/courseColor';
import './DueBadge.css';

function DueBadge({ assignments }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (assignments.length === 0) return null;

  return (
    <div className="due-badge-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="due-badge"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {assignments.length} due
      </button>

      {open && (
        <div className="due-popover">
          {assignments.map((a) => (
            <Link
              key={a.id}
              to={`/coursework?courseId=${a.course.id}`}
              className="due-popover-row"
              style={{ '--course-color': getCourseColor(a.course.id) }}
            >
              <span className="due-popover-dot" />
              <span className="due-popover-title">{a.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DueBadge;
