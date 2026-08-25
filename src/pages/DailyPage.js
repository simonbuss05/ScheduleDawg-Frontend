// src/pages/DailyPage.js
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDaySchedule } from '../api/scheduleApi';
import { addDays, toDateString, formatFullDate, getWeekdayEnum } from '../utils/dateUtils';
import { formatTime, formatDuration } from '../utils/time';
import './DailyPage.css';

function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allMeetings, setAllMeetings] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDaySchedule().then(({ allMeetings, allAssignments, allEvents }) => {
      setAllMeetings(allMeetings);
      setAllAssignments(allAssignments);
      setAllEvents(allEvents);
      setLoading(false);
    });
  }, []);

  const goToPrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const dateStr = toDateString(selectedDate);
  const isToday = dateStr === toDateString(new Date());
  const weekday = getWeekdayEnum(selectedDate);

  if (loading) return <p>Loading your day...</p>;

  const todaysMeetings = allMeetings
    .filter((m) => m.dayOfWeek === weekday)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const todaysAssignments = allAssignments
    .filter((a) => a.dueDate === dateStr)
    .sort((a, b) => a.title.localeCompare(b.title));

  const todaysEvents = allEvents
    .filter((ev) => ev.eventDate === dateStr)
    .sort((a, b) => timeToMinutes(a.meeting.startTime) - timeToMinutes(b.meeting.startTime));

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Daily View</h2>
        <div className="nav-bar">
          <button
            className="btn-secondary today-btn"
            onClick={goToToday}
            disabled={isToday}
          >
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
          <section className="detail-section map-section">
            <div className="section-header">
              <h3>Walking Route</h3>
              <span className="placeholder-badge">Estimated — live routing coming soon</span>
            </div>

            <div className="map-placeholder">
              <span className="map-placeholder-icon">🗺️</span>
              <span className="map-placeholder-text">Route map coming soon</span>
            </div>

            {todaysMeetings.length === 0 ? (
              <p className="empty-state">No classes today, so no walking route.</p>
            ) : todaysMeetings.length === 1 ? (
              <p className="empty-state">
                Just one class today — head to <strong>{todaysMeetings[0].location}</strong> for {todaysMeetings[0].course.name}.
              </p>
            ) : (
              <ul className="route-list">
                {todaysMeetings.map((m, i) => (
                  <li key={m.id} className="route-step">
                    <div className="route-stop">
                      <span className="route-stop-time">{formatTime(m.startTime)}</span>
                      <div className="route-stop-info">
                        <span className="route-stop-label">{m.course.name}</span>
                        <span className="route-stop-sub">{m.course.code} · {m.location}</span>
                      </div>
                    </div>
                    {i < todaysMeetings.length - 1 && (
                      <div className="route-leg">
                        <span className="route-leg-icon">🚶</span>
                        <span className="route-leg-time">~8 min walk</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
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
                    <span className="meeting-block-location">{m.location}</span>
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