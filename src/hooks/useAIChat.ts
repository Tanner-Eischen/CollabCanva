/**
 * AI Chat Hook
 * Manages AI chat state and communication
 * PR-30: Task 5.2
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { sendAICommand, AIRequest, AIResponse } from '../services/ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
  toolResults?: any[];
}

interface UseAIChatOptions {
  canvasId: string;
  userId: string;
  onToolExecuted?: (results: any[]) => void;
}

export function useAIChat(options: UseAIChatOptions) {
  const { canvasId, userId, onToolExecuted } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Send message to AI
   */
  const sendMessage = useCallback(async (
    message: string,
    context: {
      selectedShapes: string[];
      viewport: any;
      mode: 'shapes' | 'tilemap';
      tilemapMeta?: any;
    }
  ) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Call AI service
      const request: AIRequest = {
        message: message.trim(),
        context: {
          canvasId,
          userId,
          selectedShapes: context.selectedShapes,
          viewport: context.viewport,
          mode: context.mode,
          tilemapMeta: context.tilemapMeta,
        },
      };

      const response: AIResponse = await sendAICommand(request);

      if (response.success) {
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
          toolResults: response.toolResults,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Notify about tool execution
        if (response.toolResults && response.toolResults.length > 0 && onToolExecuted) {
          onToolExecuted(response.toolResults);
        }

      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'error',
          content: response.error || 'An error occurred',
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, errorMessage]);
        setError(response.error || 'An error occurred');
      }

    } catch (err: any) {
      console.error('Error sending AI message:', err);
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'error',
        content: err.message || 'Failed to send message',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(err.message || 'Failed to send message');

    } finally {
      setIsLoading(false);
    }
  }, [canvasId, userId, isLoading, onToolExecuted]);

  /**
   * Clear chat history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Retry last message
   */
  const retryLastMessage = useCallback((context: any) => {
    const lastUserMessage = messagesRef.current
      .filter(msg => msg.role === 'user')
      .pop();

    if (lastUserMessage) {
      // Remove last assistant/error messages
      setMessages(prev => {
        const lastUserIndex = prev.findIndex(msg => msg.id === lastUserMessage.id);
        return prev.slice(0, lastUserIndex + 1);
      });

      // Resend
      sendMessage(lastUserMessage.content, context);
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}

