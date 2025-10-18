/**
 * AI Chat Panel Component
 * Collapsible chat interface for AI agent
 * PR-30: Task 5.1
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../hooks/useAIChat';
import { useAssetLibrary } from '../../hooks/useAssetLibrary';
import { MessageBubble } from '../ai/MessageBubble';
import { isAIEnabled } from '../../services/ai/ai';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat({
    canvasId,
    userId,
    onToolExecuted: (results) => {
      console.log('Tools executed:', results);
    },
  });

  const { getAssetAIContext } = useAssetLibrary({ userId, enableSync: Boolean(userId) });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount or when popup opens
  useEffect(() => {
    if (!isCollapsed || showPopup) {
      inputRef.current?.focus();
    }
  }, [isCollapsed, showPopup]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const assetContext = getAssetAIContext({ tileSize: tilemapMeta?.tileSize });

    sendMessage(input, {
      selectedShapes,
      viewport,
      mode,
      tilemapMeta,
      assetContext,
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

  // Close popup on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPopup) {
        setShowPopup(false);
      }
    };
    
    if (showPopup) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showPopup]);

  // Auto-hide messages after 5 seconds (only last 2 messages visible)
  const recentMessages = messages.slice(-2);

  // Responsive collapse on small screens (640px = standard mobile breakpoint)
  useEffect(() => {
    const handleResize = () => {
      const shouldCollapse = window.innerWidth < 640;
      setIsCollapsed(shouldCollapse);
      // Close popup when expanding back to full view
      if (!shouldCollapse && showPopup) {
        setShowPopup(false);
      }
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showPopup]);

  // AI not enabled - show message in collapsed state
  if (!isAIEnabled()) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 rounded text-white/50 text-xs">
        <span>🤖</span>
        <span className="hidden sm:inline">AI Not Enabled</span>
      </div>
    );
  }

  // If collapsed to button
  if (isCollapsed) {
    return (
      <>
        {/* Floating Messages (Toast Style) - Above status bar */}
        <div className="fixed left-1/2 -translate-x-1/2 bottom-12 pointer-events-none z-40">
          <div className="flex flex-col-reverse gap-2 items-center">
            {isLoading && (
              <div className="bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg text-xs text-white">
                AI thinking...
              </div>
            )}
            {recentMessages.map(message => (
              <div
                key={message.id}
                className={`max-w-md px-3 py-1.5 rounded-full shadow-lg text-xs ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800/90 backdrop-blur-sm text-white'
                }`}
              >
                {message.role === 'assistant' && '🤖 '}
                <span className="truncate">{message.content}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsed Button - Positioned in status bar */}
        <button
          onClick={() => setShowPopup(!showPopup)}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-white text-xs transition-colors"
          title={showPopup ? "Close AI Assistant" : "Open AI Assistant"}
        >
          <span>🤖</span>
          <span className="hidden sm:inline">AI</span>
        </button>

        {/* Popup Modal for collapsed state */}
        {showPopup && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setShowPopup(false)}
            />
            
            {/* Popup Chat Window */}
            <div className="fixed inset-x-4 bottom-16 top-16 sm:left-auto sm:right-4 sm:w-96 sm:top-auto sm:bottom-16 sm:max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-[101] flex flex-col">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between rounded-t-lg flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <span className="text-sm font-semibold">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearMessages}
                    className="text-xs hover:bg-white/20 px-2 py-1 rounded transition-colors"
                    title="Clear chat"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="hover:bg-white/20 p-1 rounded transition-colors"
                    title="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-4">No messages yet.</p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 font-semibold">Try these:</p>
                      {EXAMPLE_COMMANDS.slice(0, 3).map((cmd, i) => (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(cmd)}
                          className="block w-full text-left text-xs text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(message => <MessageBubble key={message.id} message={message} />)}
                    <div ref={messagesEndRef} />
                  </>
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>AI thinking...</span>
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                    {error}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask AI anything..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    title="Send (Enter)"
                  >
                    Send
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <span className={mode === 'shapes' ? 'text-blue-600' : ''}>
                    {mode === 'shapes' ? '🎨 Shapes' : '🗺️ Tilemap'}
                  </span>
                  {selectedShapes.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{selectedShapes.length} selected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      {/* Floating Messages (Toast Style) - Above status bar */}
      <div className="fixed left-4 bottom-12 pointer-events-none z-40 max-w-md">
        <div className="flex flex-col-reverse gap-2 items-center">
          {isLoading && (
            <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-white text-xs">AI thinking...</span>
            </div>
          )}
          
          {recentMessages.map(message => (
            <div
              key={message.id}
              className={`max-w-md px-4 py-2 rounded-full shadow-lg text-xs animate-slide-up ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800/90 backdrop-blur-sm text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {message.role === 'assistant' && '🤖'}
                {message.role === 'user' && '👤'}
                {message.role === 'error' && '⚠️'}
                <span className="truncate max-w-xs">{message.content}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline Status Bar AI Chat - Rendered in status bar left slot */}
      <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto flex-1 min-w-0">
        {/* AI Indicator */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-medium text-white">🤖</span>
        </div>

        {/* Input - responsive width */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI..."
          className="flex-1 min-w-[80px] max-w-md px-2 py-0.5 text-[10px] focus:outline-none bg-white/10 text-white placeholder-white/50 rounded border border-white/20 focus:border-blue-400 transition-colors"
          disabled={isLoading}
        />

        {/* Mode indicator - hide on very small screens */}
        <span className="hidden sm:inline text-[10px] text-white/70 flex-shrink-0">
          {mode === 'shapes' ? '🎨' : '🗺️'}
        </span>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="Send (Enter)"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        {/* Expand History Button - hide on very small screens */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden sm:block p-1 text-white/70 hover:text-white transition-colors flex-shrink-0"
          title={isExpanded ? 'Hide history' : 'Show history'}
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Close Button - optional on very small screens */}
        <button
          onClick={onClose}
          className="p-1 text-white/50 hover:text-white transition-colors flex-shrink-0"
          title="Close AI"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Error inline */}
        {error && (
          <div className="absolute left-0 bottom-full mb-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
            {error}
          </div>
        )}
      </div>

      {/* Expanded History Panel */}
      {isExpanded && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 w-96 max-h-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-20">
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between">
            <span className="text-xs font-semibold">Chat History</span>
            <button
              onClick={clearMessages}
              className="text-xs hover:bg-white/20 px-2 py-0.5 rounded"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="p-3 space-y-2 overflow-y-auto max-h-64">
            {messages.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-500">
                No messages yet. Try: "Create a blue rectangle"
              </div>
            ) : (
              messages.map(message => <MessageBubble key={message.id} message={message} />)
            )}
          </div>
        </div>
      )}
    </>
  );
};

