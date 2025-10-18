/**
 * Tool Executor
 * Executes AI tool function calls from OpenAI
 * PR-30: Task 6.1
 */

import * as functions from 'firebase-functions';
import { ToolRegistry, ToolResult } from './toolRegistry';

interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

interface CanvasContext {
  canvasId: string;
  userId: string;
  selectedShapes: string[];
  viewport: any;
  mode: 'shapes' | 'tilemap';
  tilemapMeta?: any;
}

interface ExecutionResult {
  success: boolean;
  toolName: string;
  params: Record<string, any>;
  result?: ToolResult;
  error?: string;
  duration: number;
}

/**
 * Execute a single tool
 */
export async function executeTool(
  name: string,
  params: Record<string, any>,
  context: CanvasContext,
  registry: ToolRegistry
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // 1. Check if tool exists
    const tool = registry.get(name);
    if (!tool) {
      return {
        success: false,
        toolName: name,
        params,
        error: `Tool "${name}" not found`,
        duration: Date.now() - startTime,
      };
    }

    // 2. Validate parameters
    const validation = registry.validateParameters(name, params);
    if (!validation.valid) {
      return {
        success: false,
        toolName: name,
        params,
        error: `Invalid parameters: ${validation.errors.join(', ')}`,
        duration: Date.now() - startTime,
      };
    }

    // 3. Execute tool with timeout (25 seconds)
    const result = await Promise.race([
      tool.execute(params, context),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), 25000)
      ),
    ]);

    const duration = Date.now() - startTime;

    functions.logger.info('Tool executed successfully', {
      tool: name,
      duration,
      success: result.success,
    });

    return {
      success: true,
      toolName: name,
      params,
      result,
      duration,
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;

    functions.logger.error('Tool execution failed', {
      tool: name,
      error: error.message,
      duration,
    });

    return {
      success: false,
      toolName: name,
      params,
      error: error.message || 'Unknown error occurred',
      duration,
    };
  }
}

/**
 * Execute multiple tools in sequence
 * Continues on error and collects all results
 */
export async function executeToolChain(
  functionCalls: FunctionCall[],
  context: CanvasContext,
  registry: ToolRegistry
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  functions.logger.info('Executing tool chain', {
    toolCount: functionCalls.length,
    tools: functionCalls.map(fc => fc.name),
  });

  for (const call of functionCalls) {
    const result = await executeTool(
      call.name,
      call.arguments,
      context,
      registry
    );
    results.push(result);

    // Continue even if one fails (collect all results for debugging)
  }

  return results;
}

