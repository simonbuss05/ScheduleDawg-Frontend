// src/utils/buildingOverrides.js
const OVERRIDE_KEY = 'scheduledawg_building_overrides';

function readOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides) {
  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore, non-critical
  }
}

function normalize(building) {
  return building.trim().toLowerCase();
}

export function getBuildingOverride(building) {
  const overrides = readOverrides();
  return overrides[normalize(building)] || null;
}

export function setBuildingOverride(building, data) {
  const overrides = readOverrides();
  overrides[normalize(building)] = data;
  writeOverrides(overrides);
}