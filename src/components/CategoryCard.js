// src/components/CategoryCard.js
import { useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { getGradedItems, createGradedItem, deleteGradedItem } from '../api/gradedItemApi';
import { updateGradeCategory, deleteGradeCategory } from '../api/gradeCategoryApi';
import { calculateCategoryAverage } from '../utils/gradeCalculator';
import { useConfirm } from '../context/ConfirmContext';
import './CategoryCard.css';

function CategoryCard({ courseId, category, onItemsLoaded, onCategoryChanged, onCategoryDeleted, onClearPlaceholder }) {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [scoreMode, setScoreMode] = useState('percent');
  const [percentInput, setPercentInput] = useState('');
  const [pointsEarned, setPointsEarned] = useState('');
  const [pointsPossible, setPointsPossible] = useState('');
  const [error, setError] = useState(null);

  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(String(category.weightPercent));
  const [weightError, setWeightError] = useState(null);
  const [placeholderInput, setPlaceholderInput] = useState(
    category.placeholderScore != null ? String(category.placeholderScore) : ''
  );
  const [placeholderError, setPlaceholderError] = useState(null);

  const load = () => {
    setLoading(true);
    getGradedItems(category.id)
      .then((res) => {
        setItems(res.data);
        onItemsLoaded(category.id, res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);

  const average = calculateCategoryAverage(items);
  const usingPlaceholder = average === null && category.placeholderScore != null;
  const effectiveScore = average !== null ? average : category.placeholderScore;

  const handleAddItem = (e) => {
    e.preventDefault();
    setError(null);

    if (!itemTitle.trim()) {
      setError('Enter a title.');
      return;
    }

    let payload = { title: itemTitle.trim() };

    if (scoreMode === 'percent') {
      const pct = Number(percentInput);
      if (percentInput === '' || isNaN(pct)) {
        setError('Enter a percent.');
        return;
      }
      if (pct < 0 || pct > 100) {
        setError('Percent must be between 0 and 100.');
        return;
      }
      payload.percentScore = pct;
    } else {
      const earned = Number(pointsEarned);
      const possible = Number(pointsPossible);
      if (pointsEarned === '' || pointsPossible === '' || isNaN(earned) || isNaN(possible)) {
        setError('Enter both points earned and points possible.');
        return;
      }
      if (possible <= 0) {
        setError('Points possible must be greater than 0.');
        return;
      }
      if (earned < 0) {
        setError('Points earned cannot be negative.');
        return;
      }
      if (earned > possible) {
        setError('Points earned cannot exceed points possible.');
        return;
      }
      payload.pointsEarned = earned;
      payload.pointsPossible = possible;
    }

    createGradedItem(category.id, payload)
      .then(() => {
        setItemTitle('');
        setPercentInput('');
        setPointsEarned('');
        setPointsPossible('');
        setShowItemForm(false);
        load();
      })
      .catch(() => setError('Could not add item.'));
  };

  const handleDeleteItem = async (item) => {
    const ok = await confirm({
      title: 'Delete this item?',
      message: `"${item.title}" will be removed.`,
    });
    if (!ok) return;
    deleteGradedItem(category.id, item.id).then(load);
  };

  const handleSaveWeight = () => {
    setWeightError(null);
    const weight = Number(weightInput);
    if (weightInput === '' || isNaN(weight)) {
      setWeightError('Enter a weight.');
      return;
    }
    if (weight <= 0 || weight > 100) {
      setWeightError('Weight must be between 0 and 100.');
      return;
    }

    updateGradeCategory(courseId, category.id, {
      name: category.name,
      weightPercent: weight,
      placeholderScore: category.placeholderScore,
    }).then((res) => {
      onCategoryChanged(res.data);
      setEditingWeight(false);
    });
  };

  const handleSavePlaceholder = () => {
    setPlaceholderError(null);
    const val = Number(placeholderInput);
    if (placeholderInput === '' || isNaN(val)) {
      setPlaceholderError('Enter a value.');
      return;
    }
    if (val < 0 || val > 100) {
      setPlaceholderError('Must be between 0 and 100.');
      return;
    }

    updateGradeCategory(courseId, category.id, {
      name: category.name,
      weightPercent: category.weightPercent,
      placeholderScore: val,
    }).then((res) => {
      onCategoryChanged(res.data);
    });
  };

  const handleClear = () => {
    setPlaceholderInput('');
    setPlaceholderError(null);
    onClearPlaceholder(category);
  };

  const handleDeleteCategory = async () => {
    const ok = await confirm({
      title: `Delete "${category.name}"?`,
      message: 'All its graded items will be removed too.',
    });
    if (!ok) return;
    deleteGradeCategory(courseId, category.id).then(() => onCategoryDeleted(category.id));
  };

  return (
    <div className="category-card card">
      <div className="category-card-header">
        <div className="category-title-group">
          <span className="category-name">{category.name}</span>
          {editingWeight ? (
            <span className="category-weight-edit">
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                autoFocus
              />
              <button className="btn-secondary" onClick={handleSaveWeight}>Save</button>
            </span>
          ) : (
            <button className="category-weight-btn" onClick={() => setEditingWeight(true)}>
              {category.weightPercent}%
              <Pencil size={11} />
            </button>
          )}
        </div>
        <button className="icon-btn" onClick={handleDeleteCategory} title="Delete category">
          <X size={14} />
        </button>
      </div>
      {weightError && <p className="error">{weightError}</p>}

      <div className="category-score-row">
        {effectiveScore !== null ? (
          <span className={`category-score ${usingPlaceholder ? 'placeholder' : ''}`}>
            {effectiveScore.toFixed(1)}%{usingPlaceholder && ' (estimate)'}
          </span>
        ) : (
          <span className="category-score empty">No grades yet</span>
        )}
      </div>

      {average === null && (
        <div className="placeholder-row">
          <input
            type="number"
            placeholder="Estimated score (optional)"
            value={placeholderInput}
            onChange={(e) => setPlaceholderInput(e.target.value)}
          />
          <button className="btn-secondary" onClick={handleSavePlaceholder}>Set</button>
          {category.placeholderScore != null && (
            <button className="btn-secondary" onClick={handleClear}>Clear</button>
          )}
        </div>
      )}
      {placeholderError && <p className="error">{placeholderError}</p>}

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No items yet.</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className="item-row">
              <span className="item-title">{item.title}</span>
              <span className="item-score">
                {item.pointsEarned != null && item.pointsPossible != null
                  ? `${item.pointsEarned}/${item.pointsPossible} (${item.percentScore?.toFixed(1)}%)`
                  : `${item.percentScore?.toFixed(1)}%`}
              </span>
              <button className="icon-btn" onClick={() => handleDeleteItem(item)} title="Remove">
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showItemForm ? (
        <form className="item-form" onSubmit={handleAddItem}>
          {error && <p className="error">{error}</p>}
          <input
  value={itemTitle}
  onChange={(e) => setItemTitle(e.target.value)}
  placeholder="Ex. Homework 3"
/>
          <div className="score-mode-toggle">
            <button
              type="button"
              className={scoreMode === 'percent' ? 'active' : ''}
              onClick={() => setScoreMode('percent')}
            >
              Percent
            </button>
            <button
              type="button"
              className={scoreMode === 'points' ? 'active' : ''}
              onClick={() => setScoreMode('points')}
            >
              Points
            </button>
          </div>
          {scoreMode === 'percent' ? (
            <input
              type="number"
              value={percentInput}
              onChange={(e) => setPercentInput(e.target.value)}
              placeholder="Percent (e.g. 92)"
            />
          ) : (
            <div className="points-row">
              <input
                type="number"
                value={pointsEarned}
                onChange={(e) => setPointsEarned(e.target.value)}
                placeholder="Earned"
              />
              <span>/</span>
              <input
                type="number"
                value={pointsPossible}
                onChange={(e) => setPointsPossible(e.target.value)}
                placeholder="Possible"
              />
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowItemForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      ) : (
        <button className="btn-secondary add-item-btn" onClick={() => setShowItemForm(true)}>
          + Add Item
        </button>
      )}
    </div>
  );
}

export default CategoryCard;