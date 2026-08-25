// src/pages/WeeklyPage.js
import { useEffect, useState } from 'react';
import { getAllMeetingsWithCourses } from '../api/scheduleApi';
import './WeeklyPage.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' };

const START_HOUR = 8;  // grid starts at 8am
const END_HOUR = 21;   // grid ends at 9pm
const HOUR_HEIGHT = 60; // pixels per hour

function timeToMinutesFromStart(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours - START_HOUR) * 60 + minutes;
}

function WeeklyPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMeetingsWithCourses()
      .then(setMeetings)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading schedule...</p>;

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <div>
      <h2 className="page-title">Weekly Schedule</h2>

      <div className="week-grid">
        <div className="time-column">
          <div className="grid-header-spacer" />
          {hours.map((h) => (
            <div key={h} className="time-slot" style={{ height: HOUR_HEIGHT }}>
              {h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'am' : 'pm'}
            </div>
          ))}
        </div>

        {DAYS.map((day) => (
          <div key={day} className="day-column">
            <div className="day-header">{DAY_LABELS[day]}</div>
            <div
              className="day-body"
              style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
            >
              {meetings
                .filter((m) => m.dayOfWeek === day)
                .map((m) => {
                  const top = timeToMinutesFromStart(m.startTime);
                  const duration =
                    timeToMinutesFromStart(m.endTime) - timeToMinutesFromStart(m.startTime);
                  return (
                    <div
                      key={m.id}
                      className="meeting-block"
                      style={{ top, height: duration }}
                    >
                      <span className="meeting-block-code">{m.course.code}</span>
                      <span className="meeting-block-location">{m.location}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeeklyPage;