import React from 'react';

const LinkDocumentModal = ({
  show,
  onClose,
  documents,
  selectedInsight,
  onLinkDocument
}) => {
  if (!show || !selectedInsight) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Link Document to Insight</h2>
        <p className="modal-subtitle">{selectedInsight.content.substring(0, 100)}...</p>

        {documents.length === 0 ? (
          <div className="empty-state">
            <p>No documents available in this stack. Upload documents first!</p>
          </div>
        ) : (
          <div className="document-selection">
            <p style={{ marginBottom: '10px' }}>Select a document to link (one per insight):</p>
            {documents.map((doc) => (
              <button
                key={doc.id}
                className="document-item selectable"
                onClick={() => onLinkDocument(doc.id)}
                style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '10px', textAlign: 'left' }}
              >
                {doc.name}
                {doc.description && <div style={{ fontSize: '12px', color: '#666' }}>{doc.description}</div>}
              </button>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkDocumentModal;
