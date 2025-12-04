import React from 'react';

const MessageList = ({ messages, messagesEndRef }) => {
  return (
    <div className="chat-messages">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message ${msg.message_type === 'system' ? 'system' : 'user'}`}
        >
          {msg.message_type !== 'system' && (
            <span className="message-author">
              {msg.username || 'Unknown'}:
            </span>
          )}
          <span className="message-text">{msg.message}</span>
          <span className="message-time">
            {new Date(msg.created_at).toLocaleTimeString()}
          </span>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
