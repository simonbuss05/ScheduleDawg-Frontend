// src/components/TimePicker.js
import { useState, useEffect } from 'react';
import './TimePicker.css';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

function parseTime24(value) {
  if (!value) return { hour: 9, minute: 0, period: 'AM' };
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: m, period };
}

function toTime24({ hour, minute, period }) {
  let h = hour % 12;
  if (period === 'PM') h += 12;
  const hh = String(h).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

function TimePicker({ value, onChange }) {
  const initial = parseTime24(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [minuteText, setMinuteText] = useState(String(initial.minute).padStart(2, '0'));
  const [period, setPeriod] = useState(initial.period);

  useEffect(() => {
    onChange(toTime24({ hour, minute, period }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, period]);

  const handleMinuteChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setMinuteText(raw);

    if (raw !== '') {
      setMinute(Math.min(59, Number(raw)));
    }
  };

  const handleMinuteBlur = () => {
    if (minuteText === '') {
      setMinute(0);
      setMinuteText('00');
    } else {
      const clamped = Math.min(59, Number(minuteText));
      setMinute(clamped);
      setMinuteText(String(clamped).padStart(2, '0'));
    }
  };

  return (
    <div className="time-picker">
      <select value={hour} onChange={(e) => setHour(Number(e.target.value))}>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="time-picker-colon">:</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={minuteText}
        onChange={handleMinuteChange}
        onBlur={handleMinuteBlur}
        className="time-picker-minute"
      />
      <select value={period} onChange={(e) => setPeriod(e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default TimePicker;