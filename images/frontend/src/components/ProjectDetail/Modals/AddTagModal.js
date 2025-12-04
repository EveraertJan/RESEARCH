import React from 'react';
import ColorSquare from '../Shared/ColorSquare';

const AddTagModal = ({
  show,
  onClose,
  tags,
  selectedItem,
  itemType, // 'insight', 'image', or 'document'
  onAddTag
}) => {
  if (!show || !selectedItem) return null;

  const currentTags = selectedItem.tags || [];
  const availableTags = tags.filter(tag => !currentTags.some(t => t.id === tag.id));

  const getItemPreview = () => {
    if (itemType === 'insight') {
      return selectedItem.content.substring(0, 100) + '...';
    }
    return selectedItem.name;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Tag to {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</h2>
        <p className="modal-subtitle">{getItemPreview()}</p>

        {tags.length === 0 ? (
          <div className="empty-state">
            <p>No tags available. Create tags first!</p>
          </div>
        ) : availableTags.length === 0 ? (
          <div className="empty-state">
            <p>All tags have been added</p>
          </div>
        ) : (
          <div className="tag-selection">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                className="tag-badge selectable"
                onClick={() => onAddTag(tag.id)}
              >
                <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                <span className="tag-name">{tag.name}</span>
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

export default AddTagModal;
