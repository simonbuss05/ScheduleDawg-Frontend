// src/components/OnboardingFlow.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import CourseForm from './CourseForm';
import './OnboardingFlow.css';

const STEPS = ['welcome', 'course', 'syllabus', 'grades', 'address', 'tour', 'done'];

function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [newCourseId, setNewCourseId] = useState(null);
  const stepName = STEPS[step];
  const goTo = (i) => setStep(i);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-progress">Step {step + 1} of {STEPS.length}</div>

        {stepName === 'welcome' && (
          <>
            <h2 className="onboarding-title">Welcome to ScheduleDawg</h2>
            <p className="onboarding-body">
              Built for UGA students to keep class schedules, assignments, and grades in one
              place — with walking directions between classes and AI-assisted syllabus grading
              extraction. Here's the quick tour before you dive in.
            </p>
            <ul className="onboarding-list">
              <li>Weekly &amp; Home views of your schedule, color-coded by course</li>
              <li>Walking routes and timing between back-to-back classes</li>
              <li>Coursework: assignments and events for every class, sorted by urgency</li>
              <li>Grades: weighted categories, a letter scale, and a "what do I need on the rest" calculator</li>
              <li>Upload a syllabus PDF and let AI pull out the grading scheme for you</li>
              <li>Semesters: archive a finished term and start clean, without losing anything</li>
            </ul>
            <div className="onboarding-actions">
              <button className="btn-secondary" onClick={onComplete}>Skip for now</button>
              <button className="btn-primary" onClick={() => goTo(1)}>Get Started</button>
            </div>
          </>
        )}

        {stepName === 'course' && (
          <>
            <h3 className="onboarding-step-title">Add your first course</h3>
            <p className="onboarding-body">
              Add a class you're taking this semester — name, code, professor, and optionally its
              meeting days/times and building. You can add the rest, and edit this one, any time
              from the Courses page.
            </p>
            <CourseForm
              onCourseCreated={(course) => {
                setNewCourseId(course?.id ?? null);
                goTo(2);
              }}
              onCancel={() => goTo(2)}
            />
          </>
        )}

        {stepName === 'syllabus' && (
          <>
            <h3 className="onboarding-step-title">Upload a syllabus (optional)</h3>
            <p className="onboarding-body">
              Upload a course's syllabus PDF and ScheduleDawg uses AI to pull out its grading
              categories and letter-grade scale automatically — you review the extracted result
              before anything is saved, so nothing gets added without your OK. You can also just
              set grades up by hand later from the Grades page.
            </p>
            <div className="onboarding-actions">
              <button className="btn-secondary" onClick={() => goTo(3)}>Skip for now</button>
              <Link
                to={newCourseId ? `/syllabus?courseId=${newCourseId}` : '/syllabus'}
                className="btn-primary"
                onClick={() => goTo(3)}
              >
                Upload a syllabus
              </Link>
            </div>
          </>
        )}

        {stepName === 'grades' && (
          <>
            <h3 className="onboarding-step-title">Tracking your grades</h3>
            <p className="onboarding-body">
              Each course's grade is built from categories you define (e.g. Homework 20%, Exams
              50%) with a letter-grade scale (e.g. A = 93+). Add individual scores as percentages
              or points, and ScheduleDawg calculates your current grade automatically. The Target
              Grade Calculator answers "what average do I need on everything remaining to land an
              A-" — all from the Grades page.
            </p>
            <div className="onboarding-actions">
              <button className="btn-secondary" onClick={() => goTo(4)}>Skip for now</button>
              <Link
                to={newCourseId ? `/grades?courseId=${newCourseId}` : '/grades'}
                className="btn-primary"
                onClick={() => goTo(4)}
              >
                Set up grades
              </Link>
            </div>
          </>
        )}

        {stepName === 'address' && (
          <>
            <h3 className="onboarding-step-title">Add your home address</h3>
            <p className="onboarding-body">
              Optional — ScheduleDawg uses it to calculate walking time and turn-by-turn directions
              to your first and last class of the day, right from the Home page. You can always set
              this up later from Settings.
            </p>
            <div className="onboarding-actions">
              <button className="btn-secondary" onClick={() => goTo(5)}>Skip for now</button>
              <Link to="/settings" className="btn-primary" onClick={() => goTo(5)}>
                Set it up now
              </Link>
            </div>
          </>
        )}

        {stepName === 'tour' && (
          <>
            <h3 className="onboarding-step-title">Where everything lives</h3>
            <ul className="onboarding-list">
              <li><strong>Home</strong> — today's classes, walking route, what's due, and a grade snapshot, with arrows to flip to any other day</li>
              <li><strong>Weekly</strong> — your full week at a glance; each course gets its own color, and a "N due" badge appears on days with assignments</li>
              <li><strong>Coursework</strong> — every assignment and event in one list, grouped into Overdue / This Week / Upcoming / Done</li>
              <li><strong>Grades &amp; Syllabus</strong> — grade tracking and syllabus uploads per course</li>
              <li><strong>Semesters</strong> — the pill under the logo in the sidebar. When a term ends, use "End Semester &amp; Start New" to archive it and start with a clean course list — old semesters stay fully intact and browsable</li>
            </ul>
            <div className="onboarding-actions">
              <button className="btn-primary" onClick={() => goTo(6)}>Got it</button>
            </div>
          </>
        )}

        {stepName === 'done' && (
          <>
            <h2 className="onboarding-title">You're all set</h2>
            <p className="onboarding-body">
              Add the rest of your courses whenever you're ready, and everything else — walking
              routes, due dates, grades — builds itself from there. Let's get started.
            </p>
            <div className="onboarding-actions">
              <button className="btn-primary" onClick={onComplete}>Go to ScheduleDawg</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OnboardingFlow;
