// src/components/SyllabusUploadForm.js
import { useRef, useState } from 'react';
import { uploadSyllabus } from '../api/syllabusApi';
import './SyllabusUploadForm.css';

function SyllabusUploadForm({ courseId, onUploaded, onCancel }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }
    setFile(selected);
    setError(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('Choose a syllabus PDF first.');
      return;
    }
    setError(null);
    setUploading(true);

    uploadSyllabus(courseId, file)
      .then((res) => {
        onUploaded(res.data);
      })
      .catch(() => setError('Could not upload or process this syllabus.'))
      .finally(() => setUploading(false));
  };

  return (
    <div className="syllabus-upload-form">
      {error && <p className="error">{error}</p>}

      {file ? (
        <div className="file-chip">
          <span className="file-chip-name">{file.name}</span>
          <button type="button" className="file-chip-remove" onClick={handleRemoveFile}>
            ×
          </button>
        </div>
      ) : (
        <label className="file-picker-btn">
          Choose PDF
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            hidden
          />
        </label>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-primary" onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload & Extract'}
        </button>
      </div>
    </div>
  );
}

export default SyllabusUploadForm;