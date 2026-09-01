// src/context/OnboardingContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { onboardingKeyFor, onboardingStepKeyFor } from './onboardingStorage';

export const STEPS = ['welcome', 'course', 'syllabus', 'grades', 'address', 'tour', 'done'];

const OnboardingContext = createContext(null);

// Owns onboarding progress so both the overlay (mounted once in Layout) and
// the individual task pages it sends people to (Syllabus, Grades, Settings)
// can share one source of truth. A step that sends the user to a real page
// suppresses the overlay just for that page — resumeIfAt lets that page say
// "the actual task is done" the moment it happens (e.g. a syllabus finished
// saving), so the overlay reappears immediately, right there, instead of
// waiting for the user to navigate elsewhere. Leaving the page without
// finishing the task also resumes it, as a fallback for anyone who
// abandons the task rather than completing it.
export function OnboardingProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [suppressedAtPath, setSuppressedAtPath] = useState(null);
  const [newCourseId, setNewCourseId] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setActive(false);
      return;
    }
    if (localStorage.getItem(onboardingKeyFor(user.id))) {
      setActive(false);
      return;
    }
    const saved = localStorage.getItem(onboardingStepKeyFor(user.id));
    if (saved === null) {
      setActive(false);
      return;
    }
    setStep(Number(saved));
    setActive(true);
  }, [user?.id]);

  const goTo = (i, suppressUntilPath = null) => {
    setStep(i);
    setSuppressedAtPath(suppressUntilPath);
    if (user?.id) localStorage.setItem(onboardingStepKeyFor(user.id), String(i));
  };

  const resumeIfAt = (stepName) => {
    if (active && STEPS[step] === stepName) setSuppressedAtPath(null);
  };

  const complete = () => {
    if (user?.id) {
      localStorage.setItem(onboardingKeyFor(user.id), 'true');
      localStorage.removeItem(onboardingStepKeyFor(user.id));
    }
    setActive(false);
  };

  const visible = active && !(suppressedAtPath && location.pathname === suppressedAtPath);

  return (
    <OnboardingContext.Provider
      value={{ active, visible, step, stepName: STEPS[step], newCourseId, setNewCourseId, goTo, resumeIfAt, complete }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
