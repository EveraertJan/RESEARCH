import React from 'react';

const ChatInput = ({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  textareaRef,
  currentStack
}) => {
  return (
    <form onSubmit={onSubmit} className="chat-input-form">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={
          currentStack
            ? 'Type a message... (Shift+Enter to send)'
            : 'Use /stack [topic] to create a research stack... (Shift+Enter to send)'
        }
        className="chat-input"
        rows="1"
      />
      <button type="submit" className="btn-primary">
        Send
      </button>
    </form>
  );
};

export default ChatInput;
