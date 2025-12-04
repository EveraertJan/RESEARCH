import React from 'react';
import ColorSquare from './ColorSquare';

const TagList = ({ tags, onRemoveTag, onAddTag, showAddButton = true }) => {
  return (
    <div className="insight-tags">
      {tags?.map((tag) => (
        <span key={tag.id} className="tag-badge">
          <ColorSquare color1={tag.color1} color2={tag.color2} size={12} />
          <span className="tag-name">{tag.name}</span>
          {onRemoveTag && (
            <button
              className="tag-remove"
              onClick={() => onRemoveTag(tag.id)}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {showAddButton && onAddTag && (
        <button
          className="add-tag-btn"
          onClick={onAddTag}
        >
          +
        </button>
      )}
    </div>
  );
};

export default TagList;
