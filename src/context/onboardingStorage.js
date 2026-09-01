// src/context/onboardingStorage.js
// Shared localStorage key helpers for onboarding state — keyed per-account
// (not just per-browser) so a second account created on the same computer
// still gets its own first-run tour instead of inheriting whichever account
// last dismissed it in this browser.
export const onboardingKeyFor = (userId) => `scheduledawg_onboarded_${userId}`;

// Several onboarding steps link out to a real page (Syllabus, Grades,
// Settings) to actually perform the action. Persisting the in-progress step
// means OnboardingFlow (mounted globally in Layout) picks the tour back up
// wherever the user ends up, instead of it just vanishing with no way to
// resume it.
export const onboardingStepKeyFor = (userId) => `scheduledawg_onboarding_step_${userId}`;
