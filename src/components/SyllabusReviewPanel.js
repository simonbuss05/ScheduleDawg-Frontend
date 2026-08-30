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

    const validCategories = categories.filter((c) => c.name.trim() && c.weightPercent !== '');
    const validScale = scale.filter((s) => s.letter.trim() && s.minPercent !== '');

    Promise.all([
      ...validCategories.map((c) =>
        createGradeCategory(courseId, { name: c.name, weightPercent: Number(c.weightPercent) })
      ),
      ...validScale.map((s) =>
        createGradeScaleEntry(courseId, { letter: s.letter, minPercent: Number(s.minPercent) })
      ),
    ])
      .then(() => onSaved())
      .finally(() => setSaving(false));
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