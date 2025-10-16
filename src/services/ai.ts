/**
 * AI Service - Client-side
 * Calls Firebase Functions for AI operations
 * PR-30: Task 1.2
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';

const functions = getFunctions(app);

export interface AIRequest {
  message: string;
  context: {
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
  };
}

export interface AIResponse {
  success: boolean;
  message: string;
  toolResults?: any[];
  error?: string;
}

/**
 * Send AI command to Firebase Function
 */
export async function sendAICommand(request: AIRequest): Promise<AIResponse> {
  try {
    const aiCanvasCommand = httpsCallable<AIRequest, AIResponse>(
      functions,
      'aiCanvasCommand'
    );

    const result = await aiCanvasCommand(request);
    return result.data;

  } catch (error: any) {
    console.error('AI service error:', error);
    
    // Parse Firebase errors
    if (error.code === 'functions/unauthenticated') {
      return {
        success: false,
        message: '',
        error: 'You must be logged in to use AI features',
      };
    }

    if (error.code === 'functions/resource-exhausted') {
      return {
        success: false,
        message: '',
        error: 'Rate limit exceeded. Please wait a moment and try again.',
      };
    }

    if (error.code === 'functions/invalid-argument') {
      return {
        success: false,
        message: '',
        error: error.message || 'Invalid request',
      };
    }

    // Generic error
    return {
      success: false,
      message: '',
      error: error.message || 'AI service is temporarily unavailable',
    };
  }
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return import.meta.env.VITE_AI_ENABLED !== 'false';
}

