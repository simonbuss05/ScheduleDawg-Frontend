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

export function formatDuration(start24, end24) {
  const [sh, sm] = start24.split(':').map(Number);
  const [eh, em] = end24.split(':').map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMinutes <= 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}