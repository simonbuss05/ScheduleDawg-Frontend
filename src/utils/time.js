// src/utils/time.js
export function formatTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  const mm = String(m).padStart(2, '0');
  return `${hour}:${mm} ${period}`;
}