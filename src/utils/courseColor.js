// Deterministic per-course accent color, derived client-side from the course id.
// Keeps a stable color per course across every page without a backend field.
const PALETTE = [
  'var(--course-1)',
  'var(--course-2)',
  'var(--course-3)',
  'var(--course-4)',
  'var(--course-5)',
  'var(--course-6)',
  'var(--course-7)',
  'var(--course-8)',
];

export function getCourseColor(courseId) {
  const id = Number(courseId);
  if (!Number.isFinite(id)) return PALETTE[0];
  const index = ((id % PALETTE.length) + PALETTE.length) % PALETTE.length;
  return PALETTE[index];
}
