// src/pages/GradesPage.js
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCourses } from '../api/courseApi';
import { getGradeCategories, createGradeCategory, updateGradeCategory } from '../api/gradeCategoryApi';
import { getGradeScale, createGradeScaleEntry, deleteGradeScaleEntry } from '../api/gradeScaleApi';
import { getSyllabiByCourse } from '../api/syllabusApi';
import {
  calculateCurrentGrade,
  calculateTargetGrade,
  letterToMinPercent,
  getGradeColor,
} from '../utils/gradeCalculator';
import { useConfirm } from '../context/ConfirmContext';
import CategoryCard from '../components/CategoryCard';
import CourseGradeSummary from '../components/CourseGradeSummary';
import './GradesPage.css';

function GradesPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [scale, setScale] = useState([]);
  const [itemsByCategoryId, setItemsByCategoryId] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCourseData, setLoadingCourseData] = useState(false);
  const [courseHasSyllabus, setCourseHasSyllabus] = useState({});

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryWeight, setNewCategoryWeight] = useState('');
  const [categoryFormError, setCategoryFormError] = useState(null);

  const [showScaleForm, setShowScaleForm] = useState(false);
  const [newScaleLetter, setNewScaleLetter] = useState('');
  const [newScaleMin, setNewScaleMin] = useState('');
  const [scaleFormError, setScaleFormError] = useState(null);

  const [targetInput, setTargetInput] = useState('');
  const [targetResult, setTargetResult] = useState(null);
  const [targetError, setTargetError] = useState(null);

  useEffect(() => {
    getCourses()
      .then((res) => {
        setCourses(res.data);
        const preselectId = searchParams.get('courseId');
        if (preselectId) {
          const match = res.data.find((c) => String(c.id) === preselectId);
          if (match) handleSelectCourse(match);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourseData = (courseId) => {
    setLoadingCourseData(true);
    Promise.all([getGradeCategories(courseId), getGradeScale(courseId)]).then(
      ([catRes, scaleRes]) => {
        setCategories(catRes.data);
        setScale(scaleRes.data);
        setItemsByCategoryId({});
        setLoadingCourseData(false);
      }
    );
    getSyllabiByCourse(courseId).then((res) => {
      setCourseHasSyllabus((prev) => ({ ...prev, [courseId]: res.data.length > 0 }));
    });
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setTargetResult(null);
    setTargetInput('');
    loadCourseData(course.id);
  };

  const handleBackToAll = () => {
    setSelectedCourse(null);
    setCategories([]);
    setScale([]);
    setItemsByCategoryId({});
  };

  const handleItemsLoaded = (categoryId, items) => {
    setItemsByCategoryId((prev) => ({ ...prev, [categoryId]: items }));
  };

  const handleCategoryChanged = (updated) => {
    setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleCategoryDeleted = (categoryId) => {
    setCategories(categories.filter((c) => c.id !== categoryId));
    setItemsByCategoryId((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    setCategoryFormError(null);

    if (!newCategoryName.trim()) {
      setCategoryFormError('Enter a category name.');
      return;
    }
    const weight = Number(newCategoryWeight);
    if (newCategoryWeight === '' || isNaN(weight)) {
      setCategoryFormError('Enter a weight.');
      return;
    }
    if (weight <= 0 || weight > 100) {
      setCategoryFormError('Weight must be between 0 and 100.');
      return;
    }

    createGradeCategory(selectedCourse.id, {
      name: newCategoryName.trim(),
      weightPercent: weight,
    }).then((res) => {
      setCategories([...categories, res.data]);
      setNewCategoryName('');
      setNewCategoryWeight('');
      setShowCategoryForm(false);
    });
  };

  const handleAddScaleEntry = (e) => {
    e.preventDefault();
    setScaleFormError(null);

    if (!newScaleLetter.trim()) {
      setScaleFormError('Enter a letter.');
      return;
    }
    const min = Number(newScaleMin);
    if (newScaleMin === '' || isNaN(min)) {
      setScaleFormError('Enter a minimum percent.');
      return;
    }
    if (min < 0 || min > 100) {
      setScaleFormError('Minimum percent must be between 0 and 100.');
      return;
    }
    if (scale.some((s) => s.letter.toLowerCase() === newScaleLetter.trim().toLowerCase())) {
      setScaleFormError('That letter is already on the scale.');
      return;
    }

    createGradeScaleEntry(selectedCourse.id, {
      letter: newScaleLetter.trim(),
      minPercent: min,
    }).then((res) => {
      setScale([...scale, res.data]);
      setNewScaleLetter('');
      setNewScaleMin('');
      setShowScaleForm(false);
    });
  };

  const handleDeleteScaleEntry = async (scaleEntry) => {
    const ok = await confirm({
      title: 'Delete this grade cutoff?',
      message: `"${scaleEntry.letter}" (${scaleEntry.minPercent}%+) will be removed.`,
    });
    if (!ok) return;
    deleteGradeScaleEntry(selectedCourse.id, scaleEntry.id).then(() => {
      setScale(scale.filter((s) => s.id !== scaleEntry.id));
    });
  };

  const handleCalculateTarget = (e) => {
    e.preventDefault();
    setTargetError(null);
    setTargetResult(null);

    if (!targetInput.trim()) {
      setTargetError('Enter a target grade.');
      return;
    }

    let targetPercent = Number(targetInput);
    if (isNaN(targetPercent)) {
      const fromLetter = letterToMinPercent(targetInput, scale);
      if (fromLetter === null) {
        setTargetError('Enter a valid percent or a letter grade on your scale.');
        return;
      }
      targetPercent = fromLetter;
    } else if (targetPercent < 0 || targetPercent > 100) {
      setTargetError('Percent must be between 0 and 100.');
      return;
    }

    const result = calculateTargetGrade(targetPercent, categories, itemsByCategoryId);
    setTargetResult({ ...result, targetPercent });
  };

  const handleClearPlaceholder = (category) => {
    updateGradeCategory(selectedCourse.id, category.id, {
      name: category.name,
      weightPercent: category.weightPercent,
      placeholderScore: null,
    }).then((res) => handleCategoryChanged(res.data));
  };

  const sortedScale = [...scale].sort((a, b) => b.minPercent - a.minPercent);
  const hasSyllabus = selectedCourse && courseHasSyllabus[selectedCourse.id] === true;

  const allItemsLoaded = categories.every((c) => itemsByCategoryId[c.id] !== undefined);
  const { currentGrade, letter } = allItemsLoaded
    ? calculateCurrentGrade(categories, itemsByCategoryId, scale)
    : { currentGrade: null, letter: null };

  const totalWeight = categories.reduce((acc, c) => acc + c.weightPercent, 0);
  const weightIsOff = categories.length > 0 && Math.abs(totalWeight - 100) > 0.5;

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Grades</h2>
      </div>

      <div className="scroll-region">
        {!selectedCourse ? (
          courses.length === 0 ? (
            <p className="empty-state">No courses yet — add one from the Weekly or Courses page.</p>
          ) : (
            <div className="course-summary-grid">
              {courses.map((c) => (
                <button
                  key={c.id}
                  className="course-summary-card"
                  onClick={() => handleSelectCourse(c)}
                >
                  <div className="course-summary-top">
                    <span className="course-summary-name">{c.name}</span>
                    <span className="course-summary-chevron">&rsaquo;</span>
                  </div>
                  <span className="course-summary-code">{c.code}</span>
                  <div className="grade-summary-body">
                    <CourseGradeSummary courseId={c.id} />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : loadingCourseData ? (
          <p className="empty-state">Loading course data...</p>
        ) : (
          <>
            <button className="back-link" onClick={handleBackToAll}>
              &larr; All Courses
            </button>
            <div className="grades-course-heading">
              <h3>{selectedCourse.name}</h3>
              <span className="grades-course-code">{selectedCourse.code}</span>
              {!hasSyllabus && (
                <button
                  className="btn-secondary grades-syllabus-btn"
                  onClick={() => navigate(`/syllabus?courseId=${selectedCourse.id}`)}
                >
                  Auto-fill from Syllabus
                </button>
              )}
            </div>

            <div className="grades-layout">
              <div className="grades-left">
                <div className="current-grade-card card">
  <span className="current-grade-label">Current Grade</span>
  {currentGrade !== null ? (
    <div className="current-grade-value">
      <span className="current-grade-percent" style={{ color: getGradeColor(letter) }}>
        {currentGrade.toFixed(1)}%
      </span>
      {letter && (
        <span className="current-grade-letter" style={{ color: getGradeColor(letter) }}>
          {letter}
        </span>
      )}
    </div>
  ) : (
    <p className="empty-state">No grades entered yet.</p>
  )}
</div>

                <div className="target-card card">
                  <h3>Target Grade Calculator</h3>
                  <form onSubmit={handleCalculateTarget} className="target-form">
                    <input
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      placeholder="e.g. 90 or A-"
                    />
                    <button type="submit" className="btn-primary">Calculate</button>
                  </form>
                  {targetError && <p className="error">{targetError}</p>}
                  {targetResult && (
                    <div className="target-result">
                      {targetResult.status === 'no-remaining-categories' && (
                        <p>Every category already has data — nothing left to solve for.</p>
                      )}
                      {targetResult.status === 'already-guaranteed' && (
                        <p className="target-good">
                          You've already secured at least a {targetResult.targetPercent.toFixed(1)}%,
                          even with a 0 on everything remaining.
                        </p>
                      )}
                      {targetResult.status === 'impossible-too-high' && (
                        <p className="target-bad">
                          Not possible anymore — you'd need more than 100% on the remaining
                          categories to reach {targetResult.targetPercent.toFixed(1)}%.
                        </p>
                      )}
                      {targetResult.status === 'achievable' && (
                        <p>
                          You need an average of{' '}
                          <strong>{targetResult.neededAverage.toFixed(1)}%</strong> across:{' '}
                          {targetResult.remainingCategories.map((c) => c.name).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="scale-card card">
                  <div className="section-header">
                    <h3>Grading Scale</h3>
                    <button className="btn-primary" onClick={() => setShowScaleForm(!showScaleForm)}>
                      {showScaleForm ? 'Cancel' : '+ Add'}
                    </button>
                  </div>
                  {showScaleForm && (
                    <form className="scale-form" onSubmit={handleAddScaleEntry}>
                      {scaleFormError && <p className="error">{scaleFormError}</p>}
                      <input
  value={newScaleLetter}
  onChange={(e) => setNewScaleLetter(e.target.value)}
  placeholder="Ex. A-"
/>
                      <input
                        type="number"
                        value={newScaleMin}
                        onChange={(e) => setNewScaleMin(e.target.value)}
                        placeholder="Min %"
                      />
                      <button type="submit" className="btn-primary">Add</button>
                    </form>
                  )}
                  {sortedScale.length === 0 ? (
                    <p className="empty-state">No scale set yet.</p>
                  ) : (
                    <ul className="scale-list">
                      {sortedScale.map((s, i) => {
                        const upperBound = i === 0 ? 100 : sortedScale[i - 1].minPercent - 0.1;
                        return (
                          <li key={s.id} className="scale-row">
                            <span className="scale-letter">{s.letter}</span>
                            <span className="scale-min">
                              {s.minPercent}
                              {upperBound > s.minPercent ? ` - ${upperBound.toFixed(1)}` : ''}
                            </span>
                            <button className="icon-btn" onClick={() => handleDeleteScaleEntry(s)}>×</button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grades-right">
                <div className="section-header">
                  <h3>Categories</h3>
                  <button className="btn-primary" onClick={() => setShowCategoryForm(!showCategoryForm)}>
                    {showCategoryForm ? 'Cancel' : '+ Add Category'}
                  </button>
                </div>

                {weightIsOff && (
                  <p className="warning-banner">
                    Category weights add up to {totalWeight.toFixed(1)}%, not 100% — double check
                    your grading scheme.
                  </p>
                )}

                {showCategoryForm && (
                  <form className="category-form" onSubmit={handleAddCategory}>
                    {categoryFormError && <p className="error">{categoryFormError}</p>}
                    <input
  value={newCategoryName}
  onChange={(e) => setNewCategoryName(e.target.value)}
  placeholder="Ex. Homework"
/>
                    <input
                      type="number"
                      value={newCategoryWeight}
                      onChange={(e) => setNewCategoryWeight(e.target.value)}
                      placeholder="Weight %"
                    />
                    <button type="submit" className="btn-primary">Add</button>
                  </form>
                )}

                {categories.length === 0 ? (
                  <p className="empty-state">No categories yet.</p>
                ) : (
                  <div className="category-grid">
                    {categories.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        courseId={selectedCourse.id}
                        category={cat}
                        onItemsLoaded={handleItemsLoaded}
                        onCategoryChanged={handleCategoryChanged}
                        onCategoryDeleted={handleCategoryDeleted}
                        onClearPlaceholder={handleClearPlaceholder}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GradesPage;