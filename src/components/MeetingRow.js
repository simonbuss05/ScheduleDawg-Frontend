// src/components/MeetingRow.js
import { formatTime } from '../utils/time';

function MeetingRow({ meeting, onDeleteMeeting }) {
  return (
    <li className="meeting-row">
      <span className="meeting-day">{meeting.dayOfWeek}</span>
      <span>{formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}</span>
      <span>{meeting.location}</span>
      <button className="btn-danger" onClick={() => onDeleteMeeting(meeting.id)}>Delete</button>
    </li>
  );
}

export default MeetingRow;