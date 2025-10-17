/**
 * AI Canvas Agent Proxy
 * Handles OpenAI API calls securely on server-side
 * PR-30: Task 1.1
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { ToolRegistry } from './ai/toolRegistry';
import { buildSystemPrompt } from './ai/contextBuilder.js';
import { executeToolChain } from './ai/toolExecutor.js';

// OpenAI client - initialized lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || functions.config().openai?.key;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

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
      const { paintTileRegionTool, eraseTileRegionTool, eraseAllTilesTool, generateTilemapTool } = await import('./ai/tools/tilemapTools');
      
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
      toolRegistry.register(eraseAllTilesTool);
      toolRegistry.register(generateTilemapTool);
      
      // PR-32: Analysis and optimization tools
      const { analyzeTilemapTool, detectPatternsTool, suggestImprovementTool } = await import('./ai/tools/analysisTools');
      const { analyzePerformanceTool, estimateExportSizeTool } = await import('./ai/tools/optimizationTools');
      
      toolRegistry.register(analyzeTilemapTool);
      toolRegistry.register(detectPatternsTool);
      toolRegistry.register(suggestImprovementTool);
      toolRegistry.register(analyzePerformanceTool);
      toolRegistry.register(estimateExportSizeTool);
      
      // PR-32: Asset management tools
      const { listAssetsTool, analyzeAssetTool, suggestSlicingTool, recommendAssetTool, createAnimationTool, exportCanvasTool, selectTilesetTool, listTilesetsTool } = await import('./ai/tools/assetTools');
      
      toolRegistry.register(listAssetsTool);
      toolRegistry.register(analyzeAssetTool);
      toolRegistry.register(suggestSlicingTool);
      toolRegistry.register(recommendAssetTool);
      toolRegistry.register(createAnimationTool);
      toolRegistry.register(exportCanvasTool);
      toolRegistry.register(selectTilesetTool);  // NEW: AI-aware tileset selection
      toolRegistry.register(listTilesetsTool);   // NEW: Catalog-based tileset listing
      
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
  toolFunctions: any[],
  maxRetries = 3
): Promise<{ message: string; function_calls: any[] }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const openai = getOpenAIClient();
      
      // Convert functions to tools format (supports parallel function calling)
      const tools = toolFunctions.length > 0 
        ? toolFunctions.map(fn => ({ type: 'function' as const, function: fn }))
        : undefined;

      const completion = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        tools,
        tool_choice: tools ? 'auto' : undefined,
        parallel_tool_calls: true, // Enable parallel function calling
      });

      const choice = completion.choices[0];
      const message = choice.message;

      // Extract tool calls (supports multiple parallel calls)
      const function_calls: any[] = [];
      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'function') {
            function_calls.push({
              name: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments),
            });
          }
        }
      }

      functions.logger.info('OpenAI response', {
        toolCallsCount: function_calls.length,
        toolNames: function_calls.map(fc => fc.name),
      });

      return {
        message: message.content || 'Done.',
        function_calls,
      };

    } catch (error: any) {
      lastError = error;
      functions.logger.warn(`OpenAI API call failed (attempt ${attempt + 1})`, error.message);

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('OpenAI API call failed after retries');
}

