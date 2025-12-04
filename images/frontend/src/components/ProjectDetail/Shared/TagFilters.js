import React from 'react';
import ColorSquare from './ColorSquare';

const TagFilters = ({ tags, selectedTagIds, onToggle }) => {
  return (
    <div className="tag-filters">
      <strong>Filter by tags:</strong>
      {tags.length === 0 ? (
        <span className="no-tags">No tags yet</span>
      ) : (
        tags.map((tag) => (
          <button
            key={tag.id}
            className={`tag-filter ${selectedTagIds.includes(tag.id) ? 'active' : ''}`}
            onClick={() => onToggle(tag.id)}
          >
            <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
            <span>{tag.name}</span>
          </button>
        ))
      )}
    </div>
  );
};

export default TagFilters;
