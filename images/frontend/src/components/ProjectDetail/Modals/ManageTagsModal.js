import React, { useState } from 'react';
import ColorSquare from '../Shared/ColorSquare';

const COLOR_PALETTE = [
  { name: 'Red', value: '#FF3B30' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Yellow', value: '#FFCC00' },
  { name: 'Green', value: '#34C759' },
  { name: 'Blue', value: '#007AFF' },
  { name: 'Purple', value: '#AF52DE' },
  { name: 'Gray', value: '#8E8E93' }
];

function ManageTagsModal({ show, onClose, tags, onCreateTag, onUpdateTag, onDeleteTag }) {
  const [mode, setMode] = useState('list'); // 'list', 'create', 'edit'
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({ name: '', color1: '#007AFF', color2: null });
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', color1: '#007AFF', color2: null });
    setEditingTag(null);
    setMode('list');
  };

  const handleCreateClick = () => {
    resetForm();
    setMode('create');
  };

  const handleEditClick = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color1: tag.color1 || '#007AFF',
      color2: tag.color2 || null
    });
    setMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Tag name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        await onCreateTag(formData);
      } else if (mode === 'edit') {
        await onUpdateTag(editingTag.id, formData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save tag:', error);
      alert(`Failed to ${mode} tag`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tagId) => {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all items.')) {
      setIsLoading(true);
      try {
        await onDeleteTag(tagId);
      } catch (error) {
        console.error('Failed to delete tag:', error);
        alert('Failed to delete tag');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Tags</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {mode === 'list' ? (
          <>
            <div className="modal-body">
              <div className="tags-list">
                {tags.length === 0 ? (
                  <p className="empty-message">No tags yet. Create your first tag!</p>
                ) : (
                  <table className="tags-table">
                    <thead>
                      <tr>
                        <th>Color</th>
                        <th>Name</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.map((tag) => (
                        <tr key={tag.id}>
                          <td>
                            <ColorSquare color1={tag.color1} color2={tag.color2} size={24} />
                          </td>
                          <td>{tag.name}</td>
                          <td>
                            <button
                              onClick={() => handleEditClick(tag)}
                              className="btn-small"
                              disabled={isLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tag.id)}
                              className="btn-small btn-danger"
                              disabled={isLoading}
                              style={{ marginLeft: '8px' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={onClose}>Close</button>
              <button onClick={handleCreateClick}>Create New Tag</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>Tag Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter tag name..."
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Primary Color</label>
                <div className="color-picker">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-option ${formData.color1 === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color1: color.value })}
                      disabled={isLoading}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  Secondary Color (optional)
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, color2: null })}
                    className="btn-link"
                    disabled={isLoading}
                    style={{ marginLeft: '8px', fontSize: '12px' }}
                  >
                    Clear
                  </button>
                </label>
                <div className="color-picker">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-option ${formData.color2 === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color2: color.value })}
                      disabled={isLoading}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Preview</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ColorSquare color1={formData.color1} color2={formData.color2} size={32} />
                  <span>{formData.name || 'Tag name'}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={resetForm}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Tag' : 'Update Tag'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ManageTagsModal;
