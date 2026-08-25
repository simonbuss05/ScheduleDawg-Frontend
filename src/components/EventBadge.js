// src/components/EventBadge.js
import { useState, useRef, useEffect } from 'react';
import './EventBadge.css';

const EVENT_COLORS = ['#FFC72C', '#00B4A6', '#8B5CF6', '#FF7A45'];

function EventBadge({ events }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (events.length === 0) return null;

  return (
    <div className="event-badge-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="event-badge"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {events.length} Event{events.length === 1 ? '' : 's'}
      </button>

      {open && (
        <div className="event-popover">
          {events.map((ev, idx) => (
            <div key={ev.id} className="event-popover-row">
              <span
                className="event-popover-dot"
                style={{ backgroundColor: EVENT_COLORS[idx % EVENT_COLORS.length] }}
              />
              <span className="event-popover-title">{ev.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventBadge;