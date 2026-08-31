// src/components/SemesterSwitcher.js
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { getActiveSemester, getSemesters, createSemester, activateSemester } from '../api/semesterApi';
import './SemesterSwitcher.css';

function SemesterSwitcher() {
  const [active, setActive] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const load = () => {
    Promise.all([getActiveSemester(), getSemesters()]).then(([activeRes, listRes]) => {
      setActive(activeRes.data);
      setSemesters(listRes.data);
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setShowNewForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleStartNewSemester = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createSemester(newName.trim()).then(() => {
      // Reload so every page's own course fetch picks up the new active
      // semester — simplest way to invalidate app-wide state at once.
      window.location.reload();
    });
  };

  const handleResume = (id) => {
    activateSemester(id).then(() => window.location.reload());
  };

  const handleView = (id) => {
    setOpen(false);
    navigate(`/courses?semesterId=${id}`);
  };

  if (!active) return null;

  return (
    <div className="semester-switcher" ref={wrapperRef}>
      <button type="button" className="semester-switcher-button" onClick={() => setOpen(!open)}>
        <span className="semester-switcher-name">{active.name}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="semester-switcher-panel">
          <div className="semester-switcher-label">Semesters</div>
          <ul className="semester-list">
            {semesters.map((s) => (
              <li key={s.id} className={`semester-list-row ${s.active ? 'is-active' : ''}`}>
                <span className="semester-list-name">{s.name}</span>
                {s.active ? (
                  <span className="semester-current-badge">Current</span>
                ) : (
                  <div className="semester-list-actions">
                    <button type="button" onClick={() => handleView(s.id)}>View</button>
                    <button type="button" onClick={() => handleResume(s.id)}>Resume</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {showNewForm ? (
            <form className="semester-new-form" onSubmit={handleStartNewSemester}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Spring 2027"
                autoFocus
              />
              <div className="semester-new-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowNewForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Start</button>
              </div>
            </form>
          ) : (
            <button type="button" className="semester-end-btn" onClick={() => setShowNewForm(true)}>
              End Semester &amp; Start New
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SemesterSwitcher;
