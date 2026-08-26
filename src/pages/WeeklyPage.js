// src/pages/WeeklyPage.js
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllMeetingsWithCourses, getAllEventsWithDetails } from '../api/scheduleApi';
import { getMonday, addDays, toDateString, formatDayHeader, formatWeekRange } from '../utils/dateUtils';
import { formatTime, formatDuration } from '../utils/time';
import CourseForm from '../components/CourseForm';
import EventBadge from '../components/EventBadge';
import './WeeklyPage.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 95;
const SCROLL_PADDING = 20;

function timeToMinutesFromStart(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours - START_HOUR) * 60 + minutes;
}

function WeeklyPage() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const scrollRef = useRef(null);

  const load = () => {
    setLoading(true);
    getAllMeetingsWithCourses().then((allMeetings) => {
      setMeetings(allMeetings);
      return getAllEventsWithDetails(allMeetings);
    }).then((allEvents) => {
      setEvents(allEvents);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading || meetings.length === 0 || !scrollRef.current) return;

    const earliestStart = Math.min(
      ...meetings.map((m) => timeToMinutesFromStart(m.startTime))
    );
    const scrollTopPx = Math.max(0, earliestStart * (HOUR_HEIGHT / 60) - SCROLL_PADDING);
    scrollRef.current.scrollTop = scrollTopPx;
  }, [loading, meetings]);

  const handleCourseCreated = () => {
    setShowCourseForm(false);
    load();
  };

  const weekDates = DAYS.map((_, i) => addDays(weekStart, i));
  const todayStr = toDateString(new Date());

  const goToPrevWeek = () => setWeekStart(addDays(weekStart, -7));
  const goToNextWeek = () => setWeekStart(addDays(weekStart, 7));
  const goToThisWeek = () => setWeekStart(getMonday(new Date()));

  const isCurrentWeek = toDateString(weekStart) === toDateString(getMonday(new Date()));

  if (loading) return <p>Loading schedule...</p>;

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2 className="page-title">Weekly Schedule</h2>
        <div className="nav-bar">
          <button
            className="btn-secondary today-btn"
            onClick={goToThisWeek}
            disabled={isCurrentWeek}
          >
            This Week
          </button>
          <div className="nav-arrows">
            <button className="btn-secondary" onClick={goToPrevWeek}>&larr;</button>
            <span className="week-range">
              {formatWeekRange(weekStart)}
              {isCurrentWeek && <span className="current-badge">Current</span>}
            </span>
            <button className="btn-secondary" onClick={goToNextWeek}>&rarr;</button>
          </div>
          <button className="btn-primary" onClick={() => setShowCourseForm(!showCourseForm)}>
            {showCourseForm ? 'Cancel' : '+ Add Course'}
          </button>
        </div>
      </div>

      {showCourseForm && (
        <CourseForm onCourseCreated={handleCourseCreated} onCancel={() => setShowCourseForm(false)} />
      )}

      <div className="scroll-region" ref={scrollRef}>
        <div className="week-grid">
          <div className="time-column">
            <div className="grid-header-spacer" />
            {hours.map((h) => (
              <div key={h} className="time-slot" style={{ height: HOUR_HEIGHT }}>
                {h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'am' : 'pm'}
              </div>
            ))}
          </div>

          {DAYS.map((day, i) => {
            const dateForColumn = weekDates[i];
            const dateStr = toDateString(dateForColumn);
            const dayEvents = events.filter((ev) => ev.eventDate === dateStr);
            const isToday = dateStr === todayStr;

            return (
              <div key={day} className={`day-column ${isToday ? 'is-today' : ''}`}>
                <div className="day-header">
                  <span>{day.slice(0, 3)}</span>
                  <span className="day-header-date">
                    {formatDayHeader(dateForColumn)}
                    {isToday && <span className="today-dot" />}
                  </span>
                </div>
                <div
                  className="day-body"
                  style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
                >
                  {meetings
                    .filter((m) => m.dayOfWeek === day)
                    .map((m) => {
                      const top = timeToMinutesFromStart(m.startTime) * (HOUR_HEIGHT / 60);
                      const height =
                        (timeToMinutesFromStart(m.endTime) - timeToMinutesFromStart(m.startTime)) *
                        (HOUR_HEIGHT / 60);
                      const eventsForMeeting = dayEvents.filter((ev) => ev.meeting.id === m.id);
                      const locationText = m.building
                        ? `${m.building}${m.roomNumber ? ` ${m.roomNumber}` : ''}`
                        : '';
                      return (
                        <div
                          key={m.id}
                          className="meeting-block"
                          style={{ top, height }}
                        >
                          <Link
                            to={`/courses/${m.course.id}`}
                            className="meeting-block-name"
                            title={m.course.name}
                          >
                            {m.course.name}
                          </Link>
                          <span className="meeting-block-sub">
                            {m.course.code}{locationText ? ` · ${locationText}` : ''}
                          </span>
                          <span className="meeting-block-sub">
                            {formatTime(m.startTime)} – {formatTime(m.endTime)} ({formatDuration(m.startTime, m.endTime)})
                          </span>
                          <EventBadge events={eventsForMeeting} />
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WeeklyPage;