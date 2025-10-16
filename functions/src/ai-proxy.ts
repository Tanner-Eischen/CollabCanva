/**
 * AI Canvas Agent Proxy
 * Handles OpenAI API calls securely on server-side
 * PR-30: Task 1.1
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { ToolRegistry } from './ai/toolRegistry';
import { buildSystemPrompt } from './ai/contextBuilder';
import { executeToolChain } from './ai/toolExecutor';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.key,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '2000');
const TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');

// Rate limiting: 10 requests per minute per user
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

interface CanvasContext {
  canvasId: string;
  userId: string;
  selectedShapes: string[];
  viewport: { x: number; y: number; width: number; height: number; zoom: number };
  mode: 'shapes' | 'tilemap';
  tilemapMeta?: any;
}

interface AIRequest {
  message: string;
  context: CanvasContext;
}

interface AIResponse {
  success: boolean;
  message: string;
  toolResults?: any[];
  error?: string;
}

/**
 * Check rate limit for user
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  const db = admin.database();
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  const rateLimitRef = db.ref(`rateLimits/ai/${userId}`);
  const snapshot = await rateLimitRef.once('value');
  const requests = snapshot.val() || [];
  
  // Filter requests within current window
  const recentRequests = requests.filter((timestamp: number) => timestamp > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  await rateLimitRef.set(recentRequests);
  
  return true;
}

/**
 * Main AI Canvas Command Function
 * Callable HTTPS function that proxies OpenAI requests
 */
export const aiCanvasCommand = functions.https.onCall(
  async (data: AIRequest, context): Promise<AIResponse> => {
    try {
      // 1. Validate authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to use AI features'
        );
      }

      const userId = context.auth.uid;
      
      // 2. Check rate limiting
      const allowed = await checkRateLimit(userId);
      if (!allowed) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Rate limit exceeded. Please wait 60 seconds before trying again.'
        );
      }

      // 3. Validate request data
      if (!data.message || typeof data.message !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Message is required and must be a string'
        );
      }

      if (!data.context || !data.context.canvasId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Canvas context is required'
        );
      }

      functions.logger.info('AI request received', {
        userId,
        canvasId: data.context.canvasId,
        messageLength: data.message.length,
      });

      // 4. Initialize tool registry and register all tools
      const toolRegistry = new ToolRegistry();
      
      // Import all tools
      const { createShapeTool, deleteShapesTool, modifyShapeTool } = await import('./ai/tools/shapeTools');
      const { moveShapesTool, resizeShapeTool, rotateShapesTool } = await import('./ai/tools/transformTools');
      const { arrangeShapesTool, distributeShapesTool, alignShapesTool } = await import('./ai/tools/layoutTools');
      const { getCanvasStateTool, getSelectedShapesTool } = await import('./ai/tools/queryTools');
      const { paintTileRegionTool, eraseTileRegionTool, generateTilemapTool } = await import('./ai/tools/tilemapTools');
      
      // Register all tools
      toolRegistry.register(createShapeTool);
      toolRegistry.register(deleteShapesTool);
      toolRegistry.register(modifyShapeTool);
      toolRegistry.register(moveShapesTool);
      toolRegistry.register(resizeShapeTool);
      toolRegistry.register(rotateShapesTool);
      toolRegistry.register(arrangeShapesTool);
      toolRegistry.register(distributeShapesTool);
      toolRegistry.register(alignShapesTool);
      toolRegistry.register(getCanvasStateTool);
      toolRegistry.register(getSelectedShapesTool);
      toolRegistry.register(paintTileRegionTool);
      toolRegistry.register(eraseTileRegionTool);
      toolRegistry.register(generateTilemapTool);
      
      // 5. Build system prompt with canvas context
      const systemPrompt = buildSystemPrompt(data.context);
      
      // 6. Call OpenAI API with function calling
      const response = await callOpenAIWithRetry(
        data.message,
        systemPrompt,
        toolRegistry.toOpenAIFunctions()
      );

      // 7. Execute any function calls from OpenAI
      let toolResults: any[] = [];
      if (response.function_calls && response.function_calls.length > 0) {
        toolResults = await executeToolChain(
          response.function_calls,
          data.context,
          toolRegistry
        );
      }

      // 8. Return response
      return {
        success: true,
        message: response.message,
        toolResults,
      };

    } catch (error: any) {
      functions.logger.error('AI request failed', {
        error: error.message,
        stack: error.stack,
      });

      // Return user-friendly error
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'AI service temporarily unavailable. Please try again.'
      );
    }
  }
);

/**
 * Call OpenAI API with retry logic
 */
async function callOpenAIWithRetry(
  userMessage: string,
  systemPrompt: string,
  functions: any[],
  maxRetries = 3
): Promise<{ message: string; function_calls: any[] }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        functions: functions.length > 0 ? functions : undefined,
        function_call: functions.length > 0 ? 'auto' : undefined,
      });

      const choice = completion.choices[0];
      const message = choice.message;

      // Extract function calls if any
      const function_calls: any[] = [];
      if (message.function_call) {
        function_calls.push({
          name: message.function_call.name,
          arguments: JSON.parse(message.function_call.arguments),
        });
      }

      return {
        message: message.content || 'Done.',
        function_calls,
      };

    } catch (error: any) {
      lastError = error;
      functions.logger.warn(`OpenAI API call failed (attempt ${attempt + 1})`, {
        error: error.message,
      });

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('OpenAI API call failed after retries');
}

