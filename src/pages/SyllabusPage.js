// src/pages/SyllabusPage.js
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { X, FileText } from 'lucide-react';
import { getCourses } from '../api/courseApi';
import { getAllSyllabi, deleteSyllabus, getSyllabusFile } from '../api/syllabusApi';
import { getCourseColor } from '../utils/courseColor';
import { useConfirm } from '../context/ConfirmContext';
import SyllabusUploadForm from '../components/SyllabusUploadForm';
import SyllabusReviewPanel from '../components/SyllabusReviewPanel';
import './SyllabusPage.css';

function SyllabusPage() {
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [pendingReview, setPendingReview] = useState(null);
  const [viewingSyllabus, setViewingSyllabus] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!viewingSyllabus) return undefined;
    let objectUrl;
    getSyllabusFile(viewingSyllabus.id).then((res) => {
      objectUrl = URL.createObjectURL(res.data);
      setPdfUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfUrl(null);
    };
  }, [viewingSyllabus]);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([getCourses(), getAllSyllabi()])
      .then(([coursesRes, syllabiRes]) => {
        setCourses(coursesRes.data);
        setSyllabi(syllabiRes.data);

        const preselect = searchParams.get('courseId');
        const alreadyHas = syllabiRes.data.some((s) => String(s.course?.id) === preselect);
        if (preselect && !alreadyHas) {
          setUploadCourseId(preselect);
          setShowUpload(true);
        }
      })
      .catch(() => setLoadError('Could not load syllabi. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.code} — ${course.name}` : 'Unknown Course';
  };

  const coursesWithSyllabusIds = new Set(syllabi.map((s) => s.course?.id).filter(Boolean));
  const coursesWithoutSyllabus = courses.filter((c) => !coursesWithSyllabusIds.has(c.id));

  const handleUploaded = (result) => {
    setPendingReview({ courseId: uploadCourseId, grading: result.grading });
    setShowUpload(false);
    setUploadCourseId('');
  };

  const handleReviewDone = () => {
    setPendingReview(null);
    load();
  };

  const handleDelete = async (syllabus) => {
    const ok = await confirm({
      title: 'Delete this syllabus?',
      message: `"${syllabus.fileName}" will be removed.`,
    });
    if (!ok) return;
    deleteSyllabus(syllabus.id).then(load);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Syllabus</h2>
        {!showUpload && !pendingReview && (
          <button className="btn-primary" onClick={() => setShowUpload(true)}>
            + Upload Syllabus
          </button>
        )}
      </div>

      {loadError && (
        <div className="load-error-banner">
          <span>{loadError}</span>
          <button className="btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      <div className="scroll-region">
        {showUpload && (
          <div className="upload-panel card">
            <label>
              Course
              <select value={uploadCourseId} onChange={(e) => setUploadCourseId(e.target.value)}>
                <option value="">Select a course...</option>
                {coursesWithoutSyllabus.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </label>
            {coursesWithoutSyllabus.length === 0 && (
              <p className="empty-state">Every course already has a syllabus uploaded.</p>
            )}
            {uploadCourseId && (
              <SyllabusUploadForm
                courseId={uploadCourseId}
                onUploaded={handleUploaded}
                onCancel={() => setShowUpload(false)}
              />
            )}
          </div>
        )}

        {pendingReview && (
          <SyllabusReviewPanel
            courseId={pendingReview.courseId}
            grading={pendingReview.grading}
            onSaved={handleReviewDone}
            onDismiss={handleReviewDone}
          />
        )}

        {syllabi.length === 0 ? (
          <div className="empty-state-block">
            <FileText size={32} color="#4B5563" />
            <p>No syllabi uploaded yet.</p>
          </div>
        ) : (
          <ul className="syllabus-list">
            {syllabi.map((s) => (
              <li
                key={s.id}
                className="syllabus-row card"
                style={{ '--course-color': getCourseColor(s.course?.id) }}
              >
                <div className="syllabus-info">
                  <span className="syllabus-name">{s.fileName}</span>
                  {s.course?.id ? (
                    <Link to={`/courses/${s.course.id}`} className="syllabus-course">
                      {courseName(s.course.id)}
                    </Link>
                  ) : (
                    <span className="syllabus-course">{courseName(s.course?.id)}</span>
                  )}
                </div>
                <div className="syllabus-actions">
                  <button className="btn-secondary" onClick={() => setViewingSyllabus(s)}>
                    View
                  </button>
                  <button className="icon-btn" onClick={() => handleDelete(s)} title="Delete">
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {viewingSyllabus && (
        <div className="pdf-modal-overlay" onClick={() => setViewingSyllabus(null)}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <span>{viewingSyllabus.fileName}</span>
              <button className="btn-secondary" onClick={() => setViewingSyllabus(null)}>Close</button>
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

export default SyllabusPage;