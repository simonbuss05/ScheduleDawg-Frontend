// src/utils/dateUtils.js
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDayHeader(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeekRange(monday) {
  const friday = addDays(monday, 4);
  const startStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

export function formatDateWithWeekday(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isPastDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(23, 59, 59, 999);
  return date < new Date();
}

export function getWeekdayEnum(date) {
  const names = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return names[date.getDay()];
}

export function formatFullDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function isThisWeek(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monday = getMonday(new Date());
  const sunday = addDays(monday, 6);
  sunday.setHours(23, 59, 59, 999);
  return date >= monday && date <= sunday;
}