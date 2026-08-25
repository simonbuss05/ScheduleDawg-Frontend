// src/components/DayPicker.js
import './DayPicker.css';

const DAYS = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
];

function DayPicker({ selectedDays, onChange }) {
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="day-picker">
      {DAYS.map(({ value, label }) => (
        <button
          type="button"
          key={value}
          className={`day-chip ${selectedDays.includes(value) ? 'active' : ''}`}
          onClick={() => toggleDay(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default DayPicker;