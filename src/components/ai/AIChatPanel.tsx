/**
 * AI Chat Panel Component
 * Collapsible chat interface for AI agent
 * PR-30: Task 5.1
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../hooks/useAIChat';
import { MessageBubble } from './MessageBubble';
import { isAIEnabled } from '../../services/ai';

interface AIChatPanelProps {
  canvasId: string;
  userId: string;
  selectedShapes: string[];
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  mode: 'shapes' | 'tilemap';
  tilemapMeta?: any;
  onClose: () => void;
}

const EXAMPLE_COMMANDS = [
  'Create a red circle at (200, 200)',
  'Arrange selected shapes in a grid',
  'Generate a noise terrain tilemap 50x50',
  'Move selected shapes right by 100 pixels',
  'Align all shapes to the left',
];

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  canvasId,
  userId,
  selectedShapes,
  viewport,
  mode,
  tilemapMeta,
  onClose,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat({
    canvasId,
    userId,
    onToolExecuted: (results) => {
      console.log('Tools executed:', results);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    sendMessage(input, {
      selectedShapes,
      viewport,
      mode,
      tilemapMeta,
    });

    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (command: string) => {
    setInput(command);
    inputRef.current?.focus();
  };

  if (!isAIEnabled()) {
    return (
      <div className="fixed right-4 bottom-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
        <div className="p-4 text-center text-gray-600">
          AI features are not enabled
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearMessages}
            className="text-white hover:bg-white/20 px-2 py-1 rounded text-sm"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 px-2 py-1 rounded"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Hi! I'm your AI Canvas Assistant
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              I can help you create shapes, arrange layouts, and generate tilemaps.
            </p>
            
            {/* Example commands */}
            <div className="text-left space-y-1">
              <p className="text-xs text-gray-500 mb-2 font-semibold">Try these commands:</p>
              {EXAMPLE_COMMANDS.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(cmd)}
                  className="w-full text-left text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a command..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            Send
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          {mode === 'shapes' ? '🎨 Shape Mode' : '🗺️ Tilemap Mode'}
          {selectedShapes.length > 0 && ` • ${selectedShapes.length} selected`}
        </div>
      </div>
    </div>
  );
};

