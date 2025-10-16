/**
 * AI Context Builder
 * Builds system prompts with canvas context
 * PR-30: Task 1.4
 */

interface CanvasContext {
  canvasId: string;
  userId: string;
  selectedShapes: string[];
  viewport: { x: number; y: number; width: number; height: number; zoom: number };
  mode: 'shapes' | 'tilemap';
  tilemapMeta?: any;
}

/**
 * Build system prompt with canvas context
 * Describes capabilities and constraints to the AI
 */
export function buildSystemPrompt(context: CanvasContext): string {
  const mode = context.mode || 'shapes';
  const selectionInfo = context.selectedShapes.length > 0
    ? `${context.selectedShapes.length} shape(s) currently selected`
    : 'no shapes currently selected';

  return `You are an AI assistant for CollabCanvas, a real-time collaborative design tool.

CURRENT CANVAS STATE:
- Mode: ${mode} (${mode === 'shapes' ? 'vector shape editing' : 'tilemap editing'})
- Canvas ID: ${context.canvasId}
- Selection: ${selectionInfo}
- Viewport: ${context.viewport.width}x${context.viewport.height} at (${context.viewport.x}, ${context.viewport.y}), zoom: ${context.viewport.zoom}x

YOUR CAPABILITIES:
You can manipulate the canvas using the following categories of functions:

1. **Shape Tools**: Create, delete, and modify shapes (rectangles, circles, polygons, stars, etc.)
2. **Transform Tools**: Move, resize, and rotate shapes
3. **Layout Tools**: Arrange shapes in grids/rows/columns, align shapes, distribute spacing
4. **Tilemap Tools**: Paint tile regions, erase tiles, generate procedural tilemaps
5. **Query Tools**: Get canvas state and selected shape information

CONSTRAINTS & SAFETY:
- Maximum 100 shapes per command
- Maximum 10,000 tiles per command  
- Canvas bounds: 0-5000 pixels in both X and Y
- Valid tile types: grass, dirt, water, stone, flower
- Always confirm before deleting more than 10 shapes
- Batch operations are preferred for better performance

BEHAVIOR GUIDELINES:
- Be concise in your responses
- Execute functions immediately when the user's intent is clear
- Ask clarifying questions if the request is ambiguous
- Confirm successful actions briefly
- If an error occurs, explain what went wrong in simple terms
- When working with selected shapes, operate on those instead of creating new ones unless specified

Current mode is **${mode}**, so prioritize ${mode === 'shapes' ? 'shape manipulation' : 'tilemap'} functions.`;
}

/**
 * Compress canvas state for context
 * Summarizes large canvas states to fit token limits
 */
export function compressCanvasState(shapes: any[]): string {
  if (shapes.length === 0) {
    return 'Canvas is empty';
  }

  if (shapes.length <= 50) {
    // Full details for small canvases
    return shapes
      .map((s, i) => `${i + 1}. ${s.type} at (${s.x}, ${s.y}), ${s.width}x${s.height}`)
      .join('\n');
  }

  // Summarize large canvases
  const typeCounts: Record<string, number> = {};
  shapes.forEach(shape => {
    typeCounts[shape.type] = (typeCounts[shape.type] || 0) + 1;
  });

  const summary = Object.entries(typeCounts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

  return `Canvas has ${shapes.length} shapes total: ${summary}`;
}

/**
 * Format tool execution result for display
 */
export function formatToolResult(result: any): string {
  if (!result.success) {
    return `❌ ${result.error || 'Operation failed'}`;
  }

  return `✓ ${result.message}`;
}

