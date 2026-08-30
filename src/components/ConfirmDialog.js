// src/components/ConfirmDialog.js
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <AlertTriangle size={22} color={danger ? '#BA0C2F' : '#4B5563'} />
        </div>
        <h3 className="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className={danger ? 'btn-danger-solid' : 'btn-primary'}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;