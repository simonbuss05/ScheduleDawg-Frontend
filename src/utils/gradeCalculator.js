// src/utils/gradeCalculator.js

export function calculateCategoryAverage(items) {
  if (!items || items.length === 0) return null;
  const sum = items.reduce((acc, item) => acc + (item.percentScore ?? 0), 0);
  return sum / items.length;
}

function effectiveScoreForCategory(category, items) {
  const average = calculateCategoryAverage(items);
  if (average !== null) return { score: average, usingPlaceholder: false };
  if (category.placeholderScore != null) return { score: category.placeholderScore, usingPlaceholder: true };
  return { score: null, usingPlaceholder: false };
}

export function calculateCurrentGrade(categories, itemsByCategoryId, scale) {
  const breakdown = categories.map((cat) => {
    const items = itemsByCategoryId[cat.id] || [];
    const { score, usingPlaceholder } = effectiveScoreForCategory(cat, items);
    return {
      category: cat,
      effectiveScore: score,
      usingPlaceholder,
      included: score !== null,
    };
  });

  const included = breakdown.filter((b) => b.included);
  const totalWeight = included.reduce((acc, b) => acc + b.category.weightPercent, 0);

  let currentGrade = null;
  if (totalWeight > 0) {
    const weightedSum = included.reduce(
      (acc, b) => acc + b.effectiveScore * b.category.weightPercent,
      0
    );
    currentGrade = weightedSum / totalWeight;
  }

  const letter = currentGrade !== null ? getLetterGrade(currentGrade, scale) : null;

  return { currentGrade, letter, breakdown };
}

export function getLetterGrade(percent, scale) {
  if (!scale || scale.length === 0 || percent == null) return null;
  const sorted = [...scale].sort((a, b) => b.minPercent - a.minPercent);
  for (const entry of sorted) {
    if (percent >= entry.minPercent) return entry.letter;
  }
  return sorted[sorted.length - 1]?.letter ?? null;
}

// Maps a letter grade to a performance-appropriate color, rather than
// always using the brand red (which visually reads as a warning).
export function getGradeColor(letter) {
  if (!letter) return '#4B5563';
  const base = letter.charAt(0).toUpperCase();
  const colors = {
    A: '#16a34a', // green
    B: '#2563eb', // blue
    C: '#d97706', // amber
    D: '#ea580c', // orange
    F: '#BA0C2F', // red
  };
  return colors[base] || '#4B5563';
}

export function letterToMinPercent(letter, scale) {
  const match = scale.find((s) => s.letter.toLowerCase() === letter.trim().toLowerCase());
  return match ? match.minPercent : null;
}

export function calculateTargetGrade(targetPercent, categories, itemsByCategoryId) {
  const totalWeight = categories.reduce((acc, c) => acc + c.weightPercent, 0);

  let lockedWeightedSum = 0;
  let remainingWeight = 0;
  const remainingCategories = [];
  const lockedCategories = [];

  categories.forEach((cat) => {
    const items = itemsByCategoryId[cat.id] || [];
    const { score, usingPlaceholder } = effectiveScoreForCategory(cat, items);

    if (score !== null) {
      lockedWeightedSum += score * cat.weightPercent;
      lockedCategories.push({ category: cat, effectiveScore: score, usingPlaceholder });
    } else {
      remainingWeight += cat.weightPercent;
      remainingCategories.push(cat);
    }
  });

  if (remainingCategories.length === 0) {
    return {
      status: 'no-remaining-categories',
      neededAverage: null,
      remainingCategories: [],
      lockedCategories,
      totalWeight,
      remainingWeight: 0,
    };
  }

  const neededAverage = (targetPercent * totalWeight - lockedWeightedSum) / remainingWeight;

  let status = 'achievable';
  if (neededAverage > 100) status = 'impossible-too-high';
  else if (neededAverage < 0) status = 'already-guaranteed';

  return {
    status,
    neededAverage,
    remainingCategories,
    lockedCategories,
    totalWeight,
    remainingWeight,
  };
}