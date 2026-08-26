// src/utils/walking.js
export function formatDistance(meters) {
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function formatWalkDuration(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '<1 min';
  return `${minutes} min`;
}

export function estimateSteps(meters) {
  // average stride length ~0.762m
  return Math.round(meters / 0.762);
}