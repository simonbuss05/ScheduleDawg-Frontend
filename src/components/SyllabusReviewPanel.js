// src/components/SyllabusReviewPanel.js
import { useState } from 'react';
import { createGradeCategory } from '../api/gradeCategoryApi';
import { createGradeScaleEntry } from '../api/gradeScaleApi';
import './SyllabusReviewPanel.css';

function SyllabusReviewPanel({ courseId, grading, onSaved, onDismiss }) {
  const [categories, setCategories] = useState(
    (grading.categories || []).map((c, i) => ({
      key: i,
      name: c.name || '',
      weightPercent: c.weightPercent != null ? String(c.weightPercent) : '',
    }))
  );
  const [scale, setScale] = useState(
    (grading.scale || []).map((s, i) => ({
      key: i,
      letter: s.letter || '',
      minPercent: s.minPercent != null ? String(s.minPercent) : '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const updateCategory = (key, field, value) => {
    setCategories(categories.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  };
  const removeCategory = (key) => setCategories(categories.filter((c) => c.key !== key));

  const updateScaleEntry = (key, field, value) => {
    setScale(scale.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  };
  const removeScaleEntry = (key) => setScale(scale.filter((s) => s.key !== key));

  const handleSave = () => {
    setSaving(true);
    setSaveError(null);

    const validCategories = categories.filter((c) => c.name.trim() && c.weightPercent !== '');
    const validScale = scale.filter((s) => s.letter.trim() && s.minPercent !== '');

    // allSettled rather than all: a syllabus can produce a dozen rows, and
    // one bad one (e.g. a weight the backend rejects) shouldn't strand the
    // rest unsaved. Whatever succeeds is removed from the panel so a retry
    // only resubmits what actually failed, instead of creating duplicates
    // of rows that already saved.
    Promise.allSettled([
      ...validCategories.map((c) =>
        createGradeCategory(courseId, { name: c.name, weightPercent: Number(c.weightPercent) }).then(() => c.key)
      ),
      ...validScale.map((s) =>
        createGradeScaleEntry(courseId, { letter: s.letter, minPercent: Number(s.minPercent) }).then(() => s.key)
      ),
    ]).then((results) => {
      const savedKeys = new Set(results.filter((r) => r.status === 'fulfilled').map((r) => r.value));
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      setCategories((prev) => prev.filter((c) => !savedKeys.has(c.key)));
      setScale((prev) => prev.filter((s) => !savedKeys.has(s.key)));

      if (failedCount === 0) {
        onSaved();
      } else {
        setSaveError(
          `${failedCount} ${failedCount === 1 ? 'entry' : 'entries'} couldn't be saved. The rest were saved — fix and retry the remaining ${failedCount === 1 ? 'one' : 'ones'} below.`
        );
        setSaving(false);
      }
    });
  };

  const nothingFound = categories.length === 0 && scale.length === 0;

  return (
    <div className="review-panel">
      <h3>Review Extracted Grading Info</h3>
      {nothingFound && (
        <p className="empty-state">
          Nothing was found in this syllabus. The file was still saved — you can add categories and
          a scale manually below.
        </p>
      )}

      {categories.length > 0 && (
        <div className="review-section">
          <h4>Categories</h4>
          {categories.map((c) => (
            <div key={c.key} className="review-row">
              <input
                value={c.name}
                onChange={(e) => updateCategory(c.key, 'name', e.target.value)}
                placeholder="Category name"
              />
              <input
                type="number"
                value={c.weightPercent}
                onChange={(e) => updateCategory(c.key, 'weightPercent', e.target.value)}
                placeholder="Weight %"
              />
              <button className="remove-entry-btn" onClick={() => removeCategory(c.key)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {scale.length > 0 && (
        <div className="review-section">
          <h4>Grading Scale</h4>
          {scale.map((s) => (
            <div key={s.key} className="review-row">
              <input
                value={s.letter}
                onChange={(e) => updateScaleEntry(s.key, 'letter', e.target.value)}
                placeholder="Letter"
              />
              <input
                type="number"
                value={s.minPercent}
                onChange={(e) => updateScaleEntry(s.key, 'minPercent', e.target.value)}
                placeholder="Min %"
              />
              <button className="remove-entry-btn" onClick={() => removeScaleEntry(s.key)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {saveError && <p className="error">{saveError}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onDismiss}>
          {nothingFound ? 'Close' : 'Discard'}
        </button>
        {!nothingFound && (
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save to Course'}
          </button>
        )}
      </div>
    </div>
  );
}

export default SyllabusReviewPanel;