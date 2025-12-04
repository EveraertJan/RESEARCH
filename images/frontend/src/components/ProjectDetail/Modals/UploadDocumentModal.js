import React from 'react';
import ColorSquare from '../Shared/ColorSquare';

const UploadDocumentModal = ({
  show,
  onClose,
  onSubmit,
  tags,
  uploadData,
  setUploadData,
  onToggleTag
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Upload Document (PDF)</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="documentName">Document Name</label>
            <input
              type="text"
              id="documentName"
              value={uploadData.name}
              onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="documentDescription">Description (optional)</label>
            <textarea
              id="documentDescription"
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label htmlFor="documentFile">Select PDF</label>
            <input
              type="file"
              id="documentFile"
              accept="application/pdf,.pdf"
              onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
              required
            />
          </div>
          <div className="form-group">
            <label>Tags (optional)</label>
            <div className="tag-selection">
              {tags.length === 0 ? (
                <span className="no-tags">No tags available</span>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tag-badge selectable ${uploadData.selectedTagIds.includes(tag.id) ? 'active' : ''}`}
                    onClick={() => onToggleTag(tag.id)}
                  >
                    <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                    <span className="tag-name">{tag.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
