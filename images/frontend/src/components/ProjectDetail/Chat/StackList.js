import React from 'react';

const StackList = ({ stacks, currentStack, onSelectStack }) => {
  return (
    <div className="stack-list">
      {stacks.map((stack) => (
        <button
          key={stack.id}
          className={`stack-item ${currentStack?.id === stack.id ? 'active' : ''}`}
          onClick={() => onSelectStack(stack)}
        >
          {stack.topic}
        </button>
      ))}
    </div>
  );
};

export default StackList;
