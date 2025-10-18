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
  const MAX_TOOL_RESULTS = 4;

  const formatDuration = (duration?: unknown): string | null => {
    if (typeof duration !== 'number' || Number.isNaN(duration)) {
      return null;
    }
    if (duration >= 1000) {
      return `${(duration / 1000).toFixed(1)}s`;
    }
    return `${Math.round(duration)}ms`;
  };

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
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Tool Actions
            </div>
            <ul className="space-y-1">
              {message.toolResults.slice(0, MAX_TOOL_RESULTS).map((toolResult, index) => {
                const toolName = toolResult?.toolName || toolResult?.tool || `Tool ${index + 1}`;
                const success = toolResult?.success !== false;
                const summary =
                  toolResult?.result?.summary ||
                  toolResult?.result?.message ||
                  toolResult?.error ||
                  null;
                const durationLabel = formatDuration(toolResult?.duration);

                return (
                  <li
                    key={`${toolName}-${index}`}
                    className="bg-white/70 rounded px-2 py-1 text-[10px] text-gray-700 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate" title={toolName}>{toolName}</span>
                      <span className={success ? 'text-emerald-600' : 'text-red-500'}>
                        {success ? '✓' : '⚠️'}
                      </span>
                    </div>
                    {summary && (
                      <div className="mt-0.5 text-[9px] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap" title={summary}>
                        {summary}
                      </div>
                    )}
                    {durationLabel && (
                      <div className="mt-0.5 text-[9px] text-gray-400">
                        {durationLabel}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {message.toolResults.length > MAX_TOOL_RESULTS && (
              <div className="text-[9px] text-gray-500 mt-1">
                +{message.toolResults.length - MAX_TOOL_RESULTS} more…
              </div>
            )}
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

