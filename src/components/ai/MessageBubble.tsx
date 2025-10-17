/**
 * Message Bubble Component
 * Displays AI chat messages
 * PR-30: Task 5.1
 */

import React from 'react';
import type { ChatMessage } from '../../hooks/useAIChat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[85%] px-2.5 py-1.5 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white'
            : isError
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {/* Message content */}
        <div className="text-xs whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Tool results indicator */}
        {message.toolResults && message.toolResults.length > 0 && (
          <div className="mt-1 pt-1 border-t border-gray-300 text-[10px] opacity-75">
            ✓ {message.toolResults.length} operation(s)
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-0.5 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

