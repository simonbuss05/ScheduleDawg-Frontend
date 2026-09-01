// src/pages/PlanAheadPage.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, ExternalLink, FileText, GraduationCap } from 'lucide-react';
import {
  getPlannedCourses,
  createPlannedCourse,
  deletePlannedCourse,
  getInstructors,
  getInstructorSyllabusFile,
  getInstructorGradingSchema,
} from '../api/planAheadApi';
import { getCourseColor } from '../utils/courseColor';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import './PlanAheadPage.css';

const SEASONS = ['Spring', 'Summer', 'Fall'];

function termStorageKey(userId) {
  return `scheduledawg_planahead_term_${userId}`;
}

// A student planning ahead is almost always looking at the *next* term they
// haven't registered for yet — default to that instead of making them pick
// on every visit.
function defaultTerm() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() <= 5 ? { season: 'Fall', year } : { season: 'Spring', year: year + 1 };
}

function loadSavedTerm(userId) {
  try {
    const raw = localStorage.getItem(termStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (SEASONS.includes(parsed.season) && Number.isInteger(parsed.year)) return parsed;
  } catch {
    // ignore, fall through to default
  }
  return null;
}

// Instructors on the bulletin can appear once per section CRN under the same
// name (e.g. three listings for one professor teaching three labs) — group
// them into a single card and just note how many sections they cover.
function dedupeInstructors(instructors) {
  const byName = new Map();
  for (const instructor of instructors) {
    const displayName = instructor.instructorName.replace(/\s*\([^)]*\)\s*$/, '');
    const existing = byName.get(displayName);
    if (existing) {
      existing.sectionCount += 1;
    } else {
      byName.set(displayName, { ...instructor, displayName, sectionCount: 1 });
    }
  }
  return [...byName.values()];
}

function PlanAheadPage() {
  const confirm = useConfirm();
  const { user } = useAuth();

  const [plannedCourses, setPlannedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [term, setTerm] = useState(() => (user?.id && loadSavedTerm(user.id)) || defaultTerm());
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

  const updateTerm = (updates) => {
    const next = { ...term, ...updates };
    setTerm(next);
    if (user?.id) localStorage.setItem(termStorageKey(user.id), JSON.stringify(next));
  };

  const termLabel = `${term.season} ${term.year}`;
  const coursesForTerm = plannedCourses.filter((c) => c.termLabel === termLabel);

  const [showAddForm, setShowAddForm] = useState(false);
  const [subjectCode, setSubjectCode] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const formErrorRef = useRef(null);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [instructorsError, setInstructorsError] = useState(null);

  const [expandedInstructorId, setExpandedInstructorId] = useState(null);
  const [gradingSchemas, setGradingSchemas] = useState({});
  const [gradingSchemaLoading, setGradingSchemaLoading] = useState(null);
  const [gradingSchemaError, setGradingSchemaError] = useState(null);

  const [viewingInstructorId, setViewingInstructorId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (formError) formErrorRef.current?.scrollIntoView({ block: 'nearest' });
  }, [formError]);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    getPlannedCourses()
      .then((res) => setPlannedCourses(res.data))
      .catch(() => setLoadError('Could not load your plan. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!viewingInstructorId) return undefined;
    let objectUrl;
    getInstructorSyllabusFile(viewingInstructorId).then((res) => {
      objectUrl = URL.createObjectURL(res.data);
      setPdfUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfUrl(null);
    };
  }, [viewingInstructorId]);

  const handleAddCourse = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!subjectCode.trim() || !courseNumber.trim()) {
      setFormError('Subject and course number are required.');
      return;
    }

    setSubmitting(true);
    createPlannedCourse({
      subjectCode: subjectCode.trim().toUpperCase(),
      courseNumber: courseNumber.trim(),
      termLabel,
    })
      .then((res) => {
        setPlannedCourses([...plannedCourses, res.data]);
        setSubjectCode('');
        setCourseNumber('');
        setShowAddForm(false);
      })
      .catch(() => setFormError('Could not add that course. Try again.'))
      .finally(() => setSubmitting(false));
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setExpandedInstructorId(null);
    setInstructorsError(null);
    setInstructorsLoading(true);
    getInstructors(course.id)
      .then((res) => setInstructors(res.data))
      .catch((err) =>
        setInstructorsError(
          err.response?.data?.message || 'Could not find that course on the UGA bulletin.'
        )
      )
      .finally(() => setInstructorsLoading(false));
  };

  const handleBackToAll = () => {
    setSelectedCourse(null);
    setInstructors([]);
    setInstructorsError(null);
  };

  const handleDeleteCourse = async (course) => {
    const ok = await confirm({
      title: 'Remove this course from your plan?',
      message: `${course.subjectCode} ${course.courseNumber} will be removed.`,
    });
    if (!ok) return;
    setDeleting(true);
    deletePlannedCourse(course.id)
      .then(() => {
        setPlannedCourses(plannedCourses.filter((c) => c.id !== course.id));
        if (selectedCourse?.id === course.id) handleBackToAll();
      })
      .catch(() => setInstructorsError('Could not remove that course. Try again.'))
      .finally(() => setDeleting(false));
  };

  const handleToggleGradingSchema = (instructor) => {
    if (expandedInstructorId === instructor.id) {
      setExpandedInstructorId(null);
      return;
    }
    setExpandedInstructorId(instructor.id);
    if (gradingSchemas[instructor.id]) return;

    setGradingSchemaError(null);
    setGradingSchemaLoading(instructor.id);
    getInstructorGradingSchema(instructor.id)
      .then((res) => setGradingSchemas((prev) => ({ ...prev, [instructor.id]: res.data })))
      .catch(() => setGradingSchemaError(instructor.id))
      .finally(() => setGradingSchemaLoading(null));
  };

  const dedupedInstructors = useMemo(() => dedupeInstructors(instructors), [instructors]);

  if (loading) return <p>Loading your plan...</p>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Plan Ahead</h2>
        {!selectedCourse && (
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Course'}
          </button>
        )}
      </div>

      {!selectedCourse && (
        <div className="plan-ahead-term-picker">
          <span className="plan-ahead-term-label">Planning for</span>
          <select value={term.season} onChange={(e) => updateTerm({ season: e.target.value })}>
            {SEASONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={term.year} onChange={(e) => updateTerm({ year: Number(e.target.value) })}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {loadError && (
        <div className="load-error-banner">
          <span>{loadError}</span>
          <button className="btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      <div className="scroll-region">
        {!selectedCourse ? (
          <>
            {showAddForm && (
              <form className="plan-ahead-form card" onSubmit={handleAddCourse}>
                {formError && <p className="error" ref={formErrorRef}>{formError}</p>}
                <p className="plan-ahead-form-term-note">Adding to your {termLabel} plan</p>
                <div className="plan-ahead-form-row">
                  <label>
                    Subject
                    <input
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      placeholder="CSCI"
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </label>
                  <label>
                    Number
                    <input
                      value={courseNumber}
                      onChange={(e) => setCourseNumber(e.target.value)}
                      placeholder="1301"
                      required
                    />
                  </label>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            )}

            {coursesForTerm.length === 0 ? (
              <div className="plan-ahead-empty">
                <Compass size={32} color="#4B5563" />
                <p className="plan-ahead-empty-title">
                  {plannedCourses.length === 0
                    ? 'Scope out next semester before you register'
                    : `Nothing planned for ${termLabel} yet`}
                </p>
                <p className="plan-ahead-empty-text">
                  Add a course you're considering and ScheduleDawg looks it up on the UGA course
                  bulletin — who's teaching it, their most recent syllabus (grading categories and
                  letter scale pulled out automatically, just like the Syllabus page does for your
                  current courses), and a link to their RateMyProfessors reviews — so you can compare
                  professors before you register.
                </p>
                <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                  + Add Course
                </button>
              </div>
            ) : (
              <div className="plan-ahead-grid">
                {coursesForTerm.map((course) => (
                  <button
                    key={course.id}
                    className="plan-ahead-card"
                    style={{ '--course-color': getCourseColor(course.id) }}
                    onClick={() => handleSelectCourse(course)}
                  >
                    <div className="plan-ahead-card-top">
                      <h3>{course.subjectCode} {course.courseNumber}</h3>
                      <span className="plan-ahead-card-chevron">&rsaquo;</span>
                    </div>
                    <p className="plan-ahead-card-term">{course.termLabel}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ '--course-color': getCourseColor(selectedCourse.id) }}>
            <button className="back-link" onClick={handleBackToAll}>&larr; All Planned Courses</button>
            <div className="plan-ahead-detail-heading">
              <div>
                <h3>{selectedCourse.subjectCode} {selectedCourse.courseNumber}</h3>
                {selectedCourse.termLabel && (
                  <p className="plan-ahead-detail-term">{selectedCourse.termLabel}</p>
                )}
              </div>
              <button className="btn-danger" onClick={() => handleDeleteCourse(selectedCourse)} disabled={deleting}>
                {deleting ? 'Removing...' : 'Remove from Plan'}
              </button>
            </div>

            {instructorsLoading ? (
              <p className="empty-state">Looking up instructors on the UGA bulletin...</p>
            ) : instructorsError ? (
              <p className="error">{instructorsError}</p>
            ) : dedupedInstructors.length === 0 ? (
              <p className="empty-state">No instructors on file for this course yet.</p>
            ) : (
              <ul className="instructor-list">
                {dedupedInstructors.map((instructor) => (
                  <li key={instructor.id} className="instructor-card card">
                    <div className="instructor-card-top">
                      <div className="instructor-name-group">
                        <span className="instructor-name">{instructor.displayName}</span>
                        {instructor.sectionCount > 1 && (
                          <span className="instructor-section-badge">{instructor.sectionCount} sections</span>
                        )}
                      </div>
                      <div className="instructor-actions">
                        {instructor.syllabusAvailable && (
                          <>
                            <button
                              className="btn-secondary"
                              onClick={() => setViewingInstructorId(instructor.id)}
                            >
                              <FileText size={13} /> Syllabus
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => handleToggleGradingSchema(instructor)}
                            >
                              <GraduationCap size={13} />
                              {expandedInstructorId === instructor.id ? 'Hide Grading' : 'Grading'}
                            </button>
                          </>
                        )}
                        <a
                          className="btn-secondary"
                          href={instructor.rmpSearchUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={13} /> RateMyProfessors
                        </a>
                      </div>
                    </div>

                    {!instructor.syllabusAvailable && (
                      <p className="empty-state instructor-no-syllabus">No syllabus on file for this instructor.</p>
                    )}

                    {expandedInstructorId === instructor.id && (
                      <div className="grading-schema">
                        {gradingSchemaLoading === instructor.id ? (
                          <p className="empty-state">Reading the syllabus...</p>
                        ) : gradingSchemaError === instructor.id ? (
                          <p className="error">Could not parse a grading breakdown from this syllabus.</p>
                        ) : gradingSchemas[instructor.id] ? (
                          <div className="grading-schema-columns">
                            <div>
                              <p className="grading-schema-label">Categories</p>
                              {gradingSchemas[instructor.id].categories?.length > 0 ? (
                                <ul className="grading-category-list">
                                  {gradingSchemas[instructor.id].categories.map((c, i) => (
                                    <li key={i}>
                                      <span className="grading-item-name">{c.name}</span>
                                      <span className="grading-item-value">{c.weightPercent}%</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="empty-state">Not found in this syllabus.</p>
                              )}
                            </div>
                            <div>
                              <p className="grading-schema-label">Scale</p>
                              {gradingSchemas[instructor.id].scale?.length > 0 ? (
                                <ul className="grading-category-list">
                                  {gradingSchemas[instructor.id].scale.map((s, i) => (
                                    <li key={i}>
                                      <span className="grading-item-name">{s.letter}</span>
                                      <span className="grading-item-value">{s.minPercent}%+</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="empty-state">Not found in this syllabus.</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {viewingInstructorId && (
        <div className="pdf-modal-overlay" onClick={() => setViewingInstructorId(null)}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <span>Syllabus</span>
              <button className="btn-secondary" onClick={() => setViewingInstructorId(null)}>Close</button>
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

export default PlanAheadPage;
