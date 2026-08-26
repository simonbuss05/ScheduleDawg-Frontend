// src/components/BuildingAutocomplete.js
import { useEffect, useRef, useState } from 'react';
import { getCampusBuildings } from '../utils/campusBuildings';
import { getBuildingOverride, setBuildingOverride } from '../utils/buildingOverrides';
import './BuildingAutocomplete.css';

function BuildingAutocomplete({ value, onChange, placeholder }) {
  const [allBuildings, setAllBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [matched, setMatched] = useState(() => (value ? getBuildingOverride(value) : null));
  const wrapperRef = useRef(null);

  useEffect(() => {
    getCampusBuildings()
      .then(setAllBuildings)
      .catch(() => setAllBuildings([]))
      .finally(() => setLoadingBuildings(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions =
    value.trim().length >= 2
      ? allBuildings
          .filter((b) => b.name.toLowerCase().includes(value.trim().toLowerCase()))
          .slice(0, 6)
      : [];

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setMatched(newValue ? getBuildingOverride(newValue) : null);
    setShowDropdown(true);
  };

  const handleSelect = (building) => {
    setBuildingOverride(value, { lat: building.lat, lng: building.lng, placeName: building.name });
    setMatched({ lat: building.lat, lng: building.lng, placeName: building.name });
    setShowDropdown(false);
  };

  return (
    <div className="building-autocomplete" ref={wrapperRef}>
      <input
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {showDropdown && suggestions.length > 0 && (
        <ul className="building-suggestions">
          {suggestions.map((b) => (
            <li key={`${b.name}-${b.lat}`}>
              <button type="button" onClick={() => handleSelect(b)}>
                {b.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {loadingBuildings && <span className="building-hint">Loading campus buildings...</span>}
      {!loadingBuildings && matched && (
        <span className="building-matched-hint">✓ Matched: {matched.placeName}</span>
      )}
      {!loadingBuildings && !matched && value.trim().length >= 2 && (
        <span className="building-hint">Pick a suggestion to lock in this building's location</span>
      )}
    </div>
  );
}

export default BuildingAutocomplete;