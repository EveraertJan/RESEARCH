import React from 'react';
import StackList from './StackList';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatSection = ({
  stacks,
  currentStack,
  messages,
  messageInput,
  textareaRef,
  messagesEndRef,
  onSelectStack,
  onSendMessage,
  onMessageChange,
  onKeyDown,
  className = ''
}) => {
  return (
    <div className={`chat-section ${className}`}>
      <div className="stack-header" style={{padding: "10px", paddingBottom: '0px'}}>
        <h3>Research Stacks</h3>
      </div>

      <StackList
        stacks={stacks}
        currentStack={currentStack}
        onSelectStack={onSelectStack}
      />

      <MessageList
        messages={messages}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        value={messageInput}
        onChange={onMessageChange}
        onSubmit={onSendMessage}
        onKeyDown={onKeyDown}
        textareaRef={textareaRef}
        currentStack={currentStack}
      />
    </div>
  );
};

export default ChatSection;
