// src/pages/HomePage.js
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Map } from 'lucide-react';
import { getCourses } from '../api/courseApi';
import { getDaySchedule } from '../api/scheduleApi';
import { updateAssignment } from '../api/assignmentApi';
import { getSettings } from '../api/settingsApi';
import { addDays, toDateString, formatFullDate, getWeekdayEnum } from '../utils/dateUtils';
import { formatTime, formatDuration } from '../utils/time';
import { formatDistance, formatWalkDuration, estimateSteps } from '../utils/walking';
import { getCourseColor } from '../utils/courseColor';
import { buildDayRoute } from '../utils/dayRoute';
import { getCachedRoute, setCachedRoute } from '../utils/dayRouteCache';
import DailyMap from '../components/DailyMap';
import CourseGradeSummary from '../components/CourseGradeSummary';
import OnboardingFlow from '../components/OnboardingFlow';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

// Keyed per-account (not just per-browser) so a second account created on
// the same computer still gets its own first-run tour instead of inheriting
// whichever account last dismissed it in this browser.
const onboardingKeyFor = (userId) => `scheduledawg_onboarded_${userId}`;
// Several onboarding steps link out to a real page (Syllabus, Grades,
// Settings) to actually perform the action, which navigates away from Home
// and unmounts this component entirely. Persisting the in-progress step
// means coming back to Home resumes the tour instead of it just vanishing
// with no way to pick it back up.
const onboardingStepKeyFor = (userId) => `scheduledawg_onboarding_step_${userId}`;

const LEG_COLORS = ['#FFC72C', '#00B4A6', '#8B5CF6', '#FF7A45', '#3B82F6', '#EC4899'];

function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function HomePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [homeSettings, setHomeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([getCourses(), getDaySchedule(), getSettings()]).then(([coursesRes, schedule, settingsRes]) => {
      setCourses(coursesRes.data);
      setAllMeetings(schedule.allMeetings);
      setAllAssignments(schedule.allAssignments);
      setAllEvents(schedule.allEvents);
      setHomeSettings(settingsRes.data);
    }).catch(() => {
      setLoadError('Could not load your dashboard. Is the backend running?');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleAssignmentComplete = (assignment) => {
    const updated = { ...assignment, completed: !assignment.completed };
    updateAssignment(assignment.course.id, assignment.id, updated).then(() => {
      setAllAssignments(allAssignments.map((a) => (a.id === assignment.id ? updated : a)));
    });
  };

  const goToPrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const dateStr = toDateString(selectedDate);
  const isToday = dateStr === toDateString(new Date());
  const weekday = getWeekdayEnum(selectedDate);

  const todaysMeetings = useMemo(
    () =>
      allMeetings
        .filter((m) => m.dayOfWeek === weekday)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [allMeetings, weekday]
  );

  const todaysAssignments = useMemo(
    () =>
      allAssignments
        .filter((a) => a.dueDate === dateStr)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [allAssignments, dateStr]
  );

  const todaysEvents = useMemo(
    () =>
      allEvents
        .filter((ev) => ev.eventDate === dateStr)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [allEvents, dateStr]
  );

  const homeCoords =
    homeSettings && homeSettings.homeLatitude && homeSettings.homeLongitude
      ? { lat: homeSettings.homeLatitude, lng: homeSettings.homeLongitude }
      : null;

  useEffect(() => {
    if (!homeCoords || todaysMeetings.length === 0) {
      setRoute(null);
      return;
    }

    const cacheKey = `${dateStr}:${todaysMeetings.map((m) => m.id).join(',')}`;
    const cached = getCachedRoute(cacheKey);
    if (cached) {
      setRoute(cached);
      setRouteError(null);
      return;
    }

    setRouteLoading(true);
    setRouteError(null);
    buildDayRoute(homeCoords, todaysMeetings)
      .then((result) => {
        setCachedRoute(cacheKey, result);
        setRoute(result);
      })
      .catch((err) => setRouteError(err.message))
      .finally(() => setRouteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeCoords?.lat, homeCoords?.lng, todaysMeetings, dateStr]);

  if (loading) return <p>Loading your dashboard...</p>;

  const homeAddress = homeSettings?.homeAddress || null;

  const savedOnboardingStep = user?.id ? localStorage.getItem(onboardingStepKeyFor(user.id)) : null;

  // Once onboarding has actually started (a step was saved), keep showing it
  // regardless of course count — the "course" step adding a course is what
  // used to make `courses.length === 0` go false and silently cancel the
  // rest of the tour. Only gate the very first appearance on having no
  // courses yet, so it doesn't ambush an existing user whose localStorage
  // got cleared.
  const showOnboarding =
    !onboardingDismissed &&
    !!user?.id &&
    !localStorage.getItem(onboardingKeyFor(user.id)) &&
    (savedOnboardingStep !== null || courses.length === 0);

  const handleOnboardingStepChange = (step) => {
    if (user?.id) localStorage.setItem(onboardingStepKeyFor(user.id), String(step));
  };

  const handleOnboardingComplete = () => {
    if (user?.id) {
      localStorage.setItem(onboardingKeyFor(user.id), 'true');
      localStorage.removeItem(onboardingStepKeyFor(user.id));
    }
    setOnboardingDismissed(true);
    load();
  };

  return (
    <div className="page-shell">
      {showOnboarding && (
        <OnboardingFlow
          initialStep={savedOnboardingStep !== null ? Number(savedOnboardingStep) : 0}
          onStepChange={handleOnboardingStepChange}
          onComplete={handleOnboardingComplete}
        />
      )}
      <div className="page-header">
        <h2 className="page-title">Home</h2>
        <div className="nav-bar">
          <button className="btn-secondary today-btn" onClick={goToToday} disabled={isToday}>
            Today
          </button>
          <div className="nav-arrows">
            <button className="btn-secondary" onClick={goToPrevDay}>&larr;</button>
            <span className="week-range">
              {formatFullDate(selectedDate)}
              {isToday && <span className="current-badge">Today</span>}
            </span>
            <button className="btn-secondary" onClick={goToNextDay}>&rarr;</button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="load-error-banner">
          <span>{loadError}</span>
          <button className="btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

        <div className="daily-split">
          <div className="daily-left">
            <div className="daily-map-wrapper">
              {!homeAddress ? (
                <div className="map-placeholder">
                  <MapPin size={36} color="#4B5563" />
                  <span className="map-placeholder-text">
                    Add your home address to see walking routes
                  </span>
                  <Link to="/settings" className="btn-primary map-placeholder-cta">
                    Set Home Address
                  </Link>
                </div>
              ) : todaysMeetings.length === 0 ? (
                <div className="map-placeholder">
                  <Map size={36} color="#4B5563" />
                  <span className="map-placeholder-text">No classes {isToday ? 'today' : 'this day'}.</span>
                </div>
              ) : routeLoading ? (
                <div className="map-placeholder">
                  <span className="map-placeholder-text">Calculating your route...</span>
                </div>
              ) : routeError ? (
                <div className="map-placeholder">
                  <span className="map-placeholder-text">{routeError}</span>
                </div>
              ) : route ? (
                <DailyMap stops={route.stops} legs={route.legs} legColors={LEG_COLORS} />
              ) : null}
            </div>

            {route && (
              <div className="route-overview">
                <ul className="route-leg-list">
                  {route.legs.map((leg, i) => {
                    let tight = false;
                    if (leg.from.meeting && leg.to.meeting) {
                      const gapMinutes =
                        timeToMinutes(leg.to.meeting.startTime) -
                        timeToMinutes(leg.from.meeting.endTime);
                      const walkMinutes = leg.durationSeconds / 60;
                      tight = gapMinutes - walkMinutes < 3;
                    }
                    const color = LEG_COLORS[i % LEG_COLORS.length];
                    return (
                      <li key={i} className="route-leg-row">
                        <span className="route-leg-swatch" style={{ backgroundColor: color }} />
                        <div className="route-leg-path">
                          <span>{leg.from.label}</span>
                          <span className="route-leg-arrow">&rarr;</span>
                          <span>{leg.to.label}</span>
                          {tight && <span className="tight-badge">Tight schedule</span>}
                        </div>
                        <div className="route-leg-stats">
                          {formatWalkDuration(leg.durationSeconds)} · {formatDistance(leg.distanceMeters)}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="route-total">
                  <span className="route-total-label">Total for the day</span>
                  <span className="route-total-value">
                    {formatWalkDuration(route.totalDurationSeconds)} ·{' '}
                    {formatDistance(route.totalDistanceMeters)} ·{' '}
                    {estimateSteps(route.totalDistanceMeters).toLocaleString()} steps
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="daily-right">
            <section className="detail-section">
              <div className="section-header">
                <h3>{isToday ? "Today's Classes" : 'Classes'}</h3>
              </div>
              {todaysMeetings.length === 0 ? (
                <p className="empty-state">No classes.</p>
              ) : (
                <div className="daily-meeting-list">
                  {todaysMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="daily-meeting-card"
                      style={{ '--course-color': getCourseColor(m.course.id) }}
                    >
                      <Link to={`/courses/${m.course.id}`} className="meeting-block-name">
                        {m.course.name}
                      </Link>
                      <span className="meeting-block-code">{m.course.code}</span>
                      <span className="meeting-block-time">
                        {formatTime(m.startTime)} – {formatTime(m.endTime)}
                      </span>
                      <span className="meeting-block-duration">
                        {formatDuration(m.startTime, m.endTime)}
                      </span>
                      <span className="meeting-block-location">
                        {m.building}{m.roomNumber ? ` ${m.roomNumber}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="detail-section">
              <div className="section-header">
                <h3>Assignments Due</h3>
              </div>
              {todaysAssignments.length === 0 ? (
                <p className="empty-state">Nothing due.</p>
              ) : (
                <ul className="mini-list">
                  {todaysAssignments.map((a) => (
                    <li key={a.id} className={`mini-list-row ${a.completed ? 'completed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!a.completed}
                        onChange={() => handleToggleAssignmentComplete(a)}
                      />
                      <div className="mini-course-info">
                        <span className="mini-title">{a.title}</span>
                        <span className="mini-course-sub">{a.course.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="detail-section">
              <div className="section-header">
                <h3>Events</h3>
              </div>
              {todaysEvents.length === 0 ? (
                <p className="empty-state">No events.</p>
              ) : (
                <ul className="mini-list">
                  {todaysEvents.map((ev) => (
                    <li key={ev.id} className="mini-list-row">
                      <div className="mini-course-info">
                        <span className="mini-title">{ev.title}</span>
                        <span className="mini-course-sub">{ev.course.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="detail-section">
              <div className="section-header">
                <h3>Grades</h3>
                <Link to="/grades" className="home-section-link">View all &rsaquo;</Link>
              </div>
              {courses.length === 0 ? (
                <p className="empty-state">Add a course to start tracking grades.</p>
              ) : (
                <div className="home-grades-grid">
                  {courses.map((c) => (
                    <Link
                      key={c.id}
                      to={`/grades?courseId=${c.id}`}
                      className="home-grade-card"
                      style={{ '--course-color': getCourseColor(c.id) }}
                    >
                      <span className="home-grade-code">{c.code}</span>
                      <CourseGradeSummary courseId={c.id} onColor />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
    </div>
  );
}

export default HomePage;
