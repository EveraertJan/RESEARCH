import React from 'react';

const StackList = ({ stacks, currentStack, onSelectStack }) => {
  return (
    <div className="stack-list" style={{padding: "10px", paddingTop: "0px", display: 'flex', gap: "10px"}}>
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
