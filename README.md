# ScheduleDawg — Frontend

A React frontend for a class-schedule and grade-tracking app built for UGA
students. This is the client half of ScheduleDawg; the API lives in a
separate repo at [Schedule-Dawg](https://github.com/simonbuss05/Schedule-Dawg)
(Spring Boot + Postgres).

Live at **[schedule-dawg-frontend.vercel.app](https://schedule-dawg-frontend.vercel.app)**,
deployed on Vercel.

## What it does

- **Weekly and daily schedule views** — a full-week grid color-coded by
  course, and a day-at-a-time view with today's classes, a walking route to
  and from your first and last class (via Mapbox directions), what's due,
  and a grade snapshot.
- **Courses** — add/edit/delete courses with meeting days, times, and
  building (autocompleted against real campus buildings, proxied through
  the backend). Deleting a course cleans up its meetings, assignments,
  events, grades, and syllabus with a single confirm.
- **Coursework** — every assignment and event across all courses in one
  list, grouped into Overdue / This Week / Upcoming / Done.
- **Grades** — weighted categories, a letter-grade scale, and a target-grade
  calculator ("what average do I need on everything left to land an A-"),
  plus one-click "auto-fill from syllabus."
- **Syllabus upload** — upload a PDF and an AI-extracted grading scheme
  (categories + scale) comes back for you to review and accept before
  anything is saved.
- **Plan Ahead** — before registering for a future semester, add a course
  you're considering and see who's teaching it (from UGA's public course
  bulletin), their syllabus and grading breakdown, and a link to their
  RateMyProfessors reviews.
- **Semesters** — end the current semester and start a new one without
  losing anything; past semesters stay fully browsable from a switcher in
  the sidebar.
- **Onboarding** — a first-run walkthrough (welcome → add a course → upload
  a syllabus → set up grades → set a home address → feature tour) that
  resumes from wherever you left off if you navigate away mid-flow, instead
  of restarting or disappearing.
- **Auth** — register/login, password reset via email, and account
  deletion, all from Settings.

## Stack

React 19 · React Router 7 · Create React App · axios · Mapbox GL JS ·
lucide-react

## Architecture notes

- **All backend calls go through one axios instance**
  (`src/api/axiosConfig.js`), which attaches the JWT and centralizes the API
  base URL — nothing calls `fetch()`/`axios` against a hardcoded URL from a
  component. The one deliberate exception is Mapbox: its public token is
  designed to be used client-side (scoped by Mapbox via URL/referrer
  restrictions, not by keeping it secret), so geocoding and directions calls
  go straight from the browser to Mapbox's API.
- **Confirm dialogs are centralized**, not one-off `window.confirm()` calls.
  `ConfirmContext` + `useConfirm()` returns a promise from a shared styled
  dialog component, used consistently for every destructive action (delete
  course/assignment/event/account).
- **CRA bakes `REACT_APP_*` vars in at build time**, not runtime — changing
  one in your hosting platform's dashboard requires a fresh deploy to take
  effect, not just a restart.

## Running locally

Requires Node and a running instance of the
[backend](https://github.com/simonbuss05/Schedule-Dawg) (defaults to
`http://localhost:8080`).

```bash
npm install
cp .env.example .env.local
```

Set `REACT_APP_MAPBOX_TOKEN` in `.env.local` (get one free at
[mapbox.com](https://account.mapbox.com/)) — building autocomplete works
without it (it's proxied through the backend), but geocoding, walking
directions, and the map itself need it. Leave `REACT_APP_API_BASE_URL`
unset to use the local backend default.

```bash
npm start
```

Opens at `http://localhost:3000`.

## Project structure

```
src/
├── pages/       one component per route (HomePage, WeeklyPage, GradesPage, ...)
├── components/  shared UI (forms, cards, the confirm dialog, onboarding flow)
├── api/         one file per resource, thin wrappers around the shared axios instance
├── context/     AuthContext (session/JWT), ConfirmContext (shared confirm dialog)
├── utils/       geocoding, campus building lookup/cache
└── styles/      shared design tokens (colors, spacing) used across page CSS
```
