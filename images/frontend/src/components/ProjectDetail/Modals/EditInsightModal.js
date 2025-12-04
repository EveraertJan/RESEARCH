import React, { useState, useEffect } from 'react';

function EditInsightModal({ insight, onClose, onSave }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (insight) {
      setContent(insight.content || '');
    }
  }, [insight]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Insight content cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(insight.id, content);
      onClose();
    } catch (error) {
      console.error('Failed to update insight:', error);
      alert('Failed to update insight');
    } finally {
      setIsLoading(false);
    }
  };

  if (!insight) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Insight</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Insight Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Enter insight content..."
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditInsightModal;
