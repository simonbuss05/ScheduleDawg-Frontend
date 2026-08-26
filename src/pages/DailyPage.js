// src/pages/DailyPage.js
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDaySchedule } from '../api/scheduleApi';
import { getSettings } from '../api/settingsApi';
import { addDays, toDateString, formatFullDate, getWeekdayEnum } from '../utils/dateUtils';
import { formatTime, formatDuration } from '../utils/time';
import { formatDistance, formatWalkDuration, estimateSteps } from '../utils/walking';
import { buildDayRoute } from '../utils/dayRoute';
import DailyMap from '../components/DailyMap';
import './DailyPage.css';

const LEG_COLORS = ['#FFC72C', '#00B4A6', '#8B5CF6', '#FF7A45', '#3B82F6', '#EC4899'];

function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allMeetings, setAllMeetings] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [homeSettings, setHomeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  useEffect(() => {
    Promise.all([getDaySchedule(), getSettings()]).then(([schedule, settingsRes]) => {
      setAllMeetings(schedule.allMeetings);
      setAllAssignments(schedule.allAssignments);
      setAllEvents(schedule.allEvents);
      setHomeSettings(settingsRes.data);
      setLoading(false);
    });
  }, []);

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
        .sort((a, b) => timeToMinutes(a.meeting.startTime) - timeToMinutes(b.meeting.startTime)),
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

    setRouteLoading(true);
    setRouteError(null);
    buildDayRoute(homeCoords, todaysMeetings)
      .then(setRoute)
      .catch((err) => setRouteError(err.message))
      .finally(() => setRouteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeCoords?.lat, homeCoords?.lng, todaysMeetings]);

  if (loading) return <p>Loading your day...</p>;

  const homeAddress = homeSettings?.homeAddress || null;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Daily View</h2>
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

      <div className="daily-split">
        <div className="daily-left">
          <div className="daily-map-wrapper">
            {!homeAddress ? (
              <div className="map-placeholder">
                <span className="map-placeholder-icon">📍</span>
                <span className="map-placeholder-text">
                  Add your home address to see walking routes
                </span>
                <Link to="/settings" className="btn-primary map-placeholder-cta">
                  Set Home Address
                </Link>
              </div>
            ) : todaysMeetings.length === 0 ? (
              <div className="map-placeholder">
                <span className="map-placeholder-icon">🗺️</span>
                <span className="map-placeholder-text">No classes today.</span>
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
              <h3>Today's Classes</h3>
            </div>
            {todaysMeetings.length === 0 ? (
              <p className="empty-state">No classes today.</p>
            ) : (
              <div className="daily-meeting-list">
                {todaysMeetings.map((m) => (
                  <div key={m.id} className="daily-meeting-card">
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
              <p className="empty-state">Nothing due today.</p>
            ) : (
              <ul className="mini-list">
                {todaysAssignments.map((a) => (
                  <li key={a.id} className="mini-list-row">
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
              <h3>Events Today</h3>
            </div>
            {todaysEvents.length === 0 ? (
              <p className="empty-state">No events today.</p>
            ) : (
              <ul className="mini-list">
                {todaysEvents.map((ev) => (
                  <li key={ev.id} className="mini-list-row">
                    <span className="mini-time">{formatTime(ev.meeting.startTime)}</span>
                    <div className="mini-course-info">
                      <span className="mini-title">{ev.title}</span>
                      <span className="mini-course-sub">{ev.meeting.course.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default DailyPage;