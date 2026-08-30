// src/components/CourseGradeSummary.js
import { useEffect, useState } from 'react';
import { getGradeCategories } from '../api/gradeCategoryApi';
import { getGradeScale } from '../api/gradeScaleApi';
import { getGradedItems } from '../api/gradedItemApi';
import { calculateCurrentGrade, getGradeColor } from '../utils/gradeCalculator';
import './CourseGradeSummary.css';

function CourseGradeSummary({ courseId }) {
  const [categories, setCategories] = useState(null);
  const [itemsByCategoryId, setItemsByCategoryId] = useState({});
  const [scale, setScale] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getGradeCategories(courseId), getGradeScale(courseId)]).then(
      ([catRes, scaleRes]) => {
        setCategories(catRes.data);
        setScale(scaleRes.data);

        Promise.all(catRes.data.map((c) => getGradedItems(c.id))).then((responses) => {
          const map = {};
          catRes.data.forEach((c, i) => {
            map[c.id] = responses[i].data;
          });
          setItemsByCategoryId(map);
          setLoaded(true);
        });
      }
    );
  }, [courseId]);

  if (!loaded) {
    return <span className="grade-summary-loading">Loading...</span>;
  }

  if (categories.length === 0) {
    return <span className="grade-summary-empty">No grade categories set up</span>;
  }

  const { currentGrade, letter } = calculateCurrentGrade(categories, itemsByCategoryId, scale);

  if (currentGrade === null) {
    return <span className="grade-summary-empty">No grades entered yet</span>;
  }

  const color = getGradeColor(letter);

  return (
    <div className="grade-summary-value">
      <span className="grade-summary-percent" style={{ color }}>
        {currentGrade.toFixed(1)}%
      </span>
      {letter && (
        <span className="grade-summary-letter" style={{ color }}>
          {letter}
        </span>
      )}
    </div>
  );
}

export default CourseGradeSummary;