// src/components/MeetingRow.js
import { useState } from 'react';
import { formatTime } from '../utils/time';
import MeetingEditForm from './MeetingEditForm';

function MeetingRow({ meeting, courseId, onDeleteMeeting, onMeetingUpdated }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="meeting-row-editing">
        <MeetingEditForm
          courseId={courseId}
          meeting={meeting}
          onSaved={(updated) => {
            onMeetingUpdated(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const label = `${meeting.dayOfWeek} ${formatTime(meeting.startTime)}`;

  return (
    <li className="meeting-row">
      <span className="meeting-day">{meeting.dayOfWeek}</span>
      <span>{formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}</span>
      <span>{meeting.building}{meeting.roomNumber ? ` ${meeting.roomNumber}` : ''}</span>
      <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
      <button className="btn-danger" onClick={() => onDeleteMeeting(meeting.id, label)}>Delete</button>
    </li>
  );
}

export default MeetingRow;