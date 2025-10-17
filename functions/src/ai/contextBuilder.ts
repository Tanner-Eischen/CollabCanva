/**
 * AI Context Builder
 * Builds system prompts with canvas context
 * PR-30: Task 1.4
 * PR-32: Enhanced with game type detection, assets, and performance stats
 */

interface CanvasContext {
  canvasId: string;
  userId: string;
  selectedShapes: string[];
  viewport: { x: number; y: number; width: number; height: number; zoom: number };
  mode: 'shapes' | 'tilemap';
  tilemapMeta?: any;
  // PR-32: Enhanced context
  gameType?: 'platformer' | 'top-down' | 'puzzle' | 'shooter' | 'unknown';
  gameTypeConfidence?: number;
  objectCount?: number;
  tileCount?: number;
  availableAssets?: {
    spritesheets: number;
    tilesets: number;
    animations: number;
  };
  performanceScore?: number;
  performanceRating?: 'excellent' | 'good' | 'fair' | 'poor';
  // NEW: Detailed asset library info
  assetStats?: {
    totalTilesets: number;
    availableTileSizes: number[];
    availableThemes: string[];
    availableMaterials: string[];
    hasAutotileSets: boolean;
    hasAnimatedSets: boolean;
    hasPropSets: boolean;
  };
  tilesetSuggestions?: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
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

  // Calculate visible bounds (what the user can actually see)
  const visibleLeft = Math.round(-context.viewport.x / context.viewport.zoom);
  const visibleTop = Math.round(-context.viewport.y / context.viewport.zoom);
  const visibleRight = Math.round((-context.viewport.x + context.viewport.width) / context.viewport.zoom);
  const visibleBottom = Math.round((-context.viewport.y + context.viewport.height) / context.viewport.zoom);
  const visibleCenterX = Math.round((visibleLeft + visibleRight) / 2);
  const visibleCenterY = Math.round((visibleTop + visibleBottom) / 2);

  // For tilemap mode, calculate visible tile range
  const tileSize = context.tilemapMeta?.tileSize || 32;
  const visibleTileLeft = Math.floor(visibleLeft / tileSize);
  const visibleTileTop = Math.floor(visibleTop / tileSize);
  const visibleTileRight = Math.ceil(visibleRight / tileSize);
  const visibleTileBottom = Math.ceil(visibleBottom / tileSize);
  const visibleTileCenterCol = Math.round((visibleTileLeft + visibleTileRight) / 2);
  const visibleTileCenterRow = Math.round((visibleTileTop + visibleTileBottom) / 2);

  // Build game development context (PR-32)
  let gameDevContext = '';
  if (context.gameType && context.gameType !== 'unknown') {
    gameDevContext = `

GAME DEVELOPMENT CONTEXT:
- Detected Game Type: ${context.gameType} (${Math.round((context.gameTypeConfidence || 0) * 100)}% confidence)
- Content: ${context.objectCount || 0} objects, ${context.tileCount || 0} tiles`;
    
    if (context.availableAssets) {
      gameDevContext += `
- Available Assets: ${context.availableAssets.spritesheets} sprite sheets, ${context.availableAssets.tilesets} tilesets, ${context.availableAssets.animations} animations`;
    }
    
    if (context.performanceRating) {
      gameDevContext += `
- Performance: ${context.performanceRating} (score: ${context.performanceScore}/100)`;
      
      if (context.performanceRating === 'poor' || context.performanceRating === 'fair') {
        gameDevContext += ' ⚠️ Consider optimizations';
      }
    }
  }
  
  // Build asset library context (NEW)
  let assetLibraryContext = '';
  if (context.assetStats && context.assetStats.totalTilesets > 0) {
    assetLibraryContext = `

TILESET LIBRARY:
- Total Tilesets: ${context.assetStats.totalTilesets}
- Available Sizes: ${context.assetStats.availableTileSizes.join('px, ')}px
- Themes: ${context.assetStats.availableThemes.slice(0, 5).join(', ')}${context.assetStats.availableThemes.length > 5 ? '...' : ''}
- Materials: ${context.assetStats.availableMaterials.slice(0, 5).join(', ')}${context.assetStats.availableMaterials.length > 5 ? '...' : ''}
- Features: ${[
    context.assetStats.hasAutotileSets ? 'Auto-tiling' : null,
    context.assetStats.hasAnimatedSets ? 'Animated' : null,
    context.assetStats.hasPropSets ? 'Props' : null
  ].filter(Boolean).join(', ') || 'None'}`;
    
    if (context.tilesetSuggestions && context.tilesetSuggestions.length > 0) {
      assetLibraryContext += `
- Suggested for current context: ${context.tilesetSuggestions.map(s => `"${s.name}" (${s.reason})`).join(', ')}`;
    }
    
    assetLibraryContext += `

TIP: Use selectTileset() to find the best tileset for your needs, or listTilesets() to browse available options.`;
  } else if (context.mode === 'tilemap') {
    assetLibraryContext = `

TILESET LIBRARY:
⚠️ No tilesets uploaded yet. User should upload tilesets to use tilemap painting features.
Suggest: "Upload a tileset to get started with tilemap painting"`;
  }

  return `You are an AI assistant for CollabCanvas, a real-time collaborative game development and design tool with advanced procedural generation capabilities.

CURRENT CANVAS STATE:
- Mode: ${mode} (${mode === 'shapes' ? 'vector shape editing' : 'tilemap editing'})
- Canvas ID: ${context.canvasId}
- Selection: ${selectionInfo}
- Zoom: ${context.viewport.zoom}x${gameDevContext}${assetLibraryContext}

VISIBLE AREA (what the user can see):
${mode === 'shapes' ? `- Canvas coordinates: X from ${visibleLeft} to ${visibleRight}, Y from ${visibleTop} to ${visibleBottom}
- Visible center: (${visibleCenterX}, ${visibleCenterY})
- Visible dimensions: ${visibleRight - visibleLeft}x${visibleBottom - visibleTop} pixels` : `- Tile coordinates: Column ${visibleTileLeft} to ${visibleTileRight}, Row ${visibleTileTop} to ${visibleTileBottom}
- Visible center tile: Column ${visibleTileCenterCol}, Row ${visibleTileCenterRow}
- Tile size: ${tileSize}x${tileSize} pixels`}

YOUR CAPABILITIES:
You can manipulate the canvas using the following categories of functions:

1. **Shape Tools**: Create, delete, and modify shapes (rectangles, circles, polygons, stars, etc.)
2. **Transform Tools**: Move, resize, and rotate shapes
3. **Layout Tools**: Arrange shapes in grids/rows/columns, align shapes, distribute spacing
4. **Tilemap Tools**: Paint tile regions, erase tiles, generate procedural tilemaps with advanced algorithms:
   - **perlin-noise**: Natural terrain with hills and valleys (best for outdoor landscapes)
   - **cellular-automata**: Organic cave systems and dungeons (best for underground levels)
   - **wave-function-collapse**: Constraint-based generation with valid tile placement
   - **random-walk**: Winding paths and rivers
5. **Query Tools**: Get canvas state and selected shape information
6. **Analysis Tools** (PR-32 NEW):
   - **analyzeTilemap**: Get tile distribution, density, and suggestions
   - **detectPatterns**: Identify game type (platformer, top-down, puzzle, etc.)
   - **suggestImprovement**: Get specific recommendations for the current canvas
7. **Optimization Tools** (PR-32 NEW):
   - **analyzePerformance**: Check FPS, object count, draw calls, and bottlenecks
   - **estimateExportSize**: Calculate export file size for different game engines
8. **Asset Management Tools** (PR-32 NEW):
   - **listAssets**: See all available sprites, tilesets, and assets that can be used
   - **analyzeAsset**: Examine a specific asset's properties and how to use it
   - **suggestSlicing**: AI suggests how to slice/split a sprite sheet based on dimensions
   - **recommendAsset**: Ask AI which asset to use for a specific purpose (e.g., "grass tiles")
   - **selectTileset** (NEW): AI-powered tileset selection using themes, materials, and features
   - **listTilesets** (NEW): Browse user's tileset library with smart filtering

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

GAME DEVELOPMENT GUIDELINES (PR-32):
- When generating terrain, suggest appropriate algorithms based on game type
- For platformers: Use perlin-noise or simple noise for varied terrain
- For dungeons/caves: Use cellular-automata for organic layouts
- For paths/rivers: Use random-walk with smooth option
- Always consider performance: warn if object count > 500 or tilemap > 10,000 tiles
- Suggest using analyzeTilemap after generation to check quality
- Recommend detectPatterns if game type is unclear
- For large projects, proactively suggest analyzePerformance

ASSET MANAGEMENT GUIDELINES (PR-32 NEW):
- When user asks about available tiles/sprites, use **listAssets** or **listTilesets** to show what they have
- Before creating tilemaps, use **selectTileset** to find the best match based on theme, materials, and tile size
- When user mentions specific materials (grass, water, stone), use **selectTileset** with those materials
- For browsing options, use **listTilesets** with filters (tileSize, theme, hasAutotile, etc.)
- When user uploads a sprite sheet, offer to help analyze it with **suggestSlicing**
- Use **analyzeAsset** to help users understand complex tilesets (auto-tiles, sprite counts, etc.)
- Proactively suggest listing assets if user seems unsure what visual resources are available
- When user asks "what should I add?", use detectPatterns + suggestImprovement
- If user says "paint grass" or similar, automatically use **selectTileset** to find matching tileset
- Prefer **selectTileset** over **recommendAsset** for tilemaps (it's smarter and catalog-aware)

**DEFAULT POSITIONING (CRITICAL):**
${mode === 'shapes' ? `- ALWAYS place new shapes within the VISIBLE AREA unless user specifies coordinates
- Default to visible center (${visibleCenterX}, ${visibleCenterY}) for single shapes
- For multiple shapes, distribute them within the visible bounds
- NEVER default to (0, 0) or top-left corner unless explicitly requested
- Use getCanvasState tool first to check what already exists in the visible area
- Avoid overlapping existing shapes when possible - offset new shapes to empty space` : `- ALWAYS place tiles within the VISIBLE TILE RANGE unless user specifies coordinates
- Default to visible center tile (Col ${visibleTileCenterCol}, Row ${visibleTileCenterRow})
- For painting regions, stay within visible bounds or ask for clarification
- NEVER default to tile (0, 0) unless explicitly requested
- When generating tilemaps, consider the visible area size as a guide for dimensions`}

**CONFLICT AVOIDANCE:**
- Before creating shapes/tiles, call getCanvasState to see what exists in the target area
- If the visible area is crowded, suggest an empty region or ask user for placement preference
- For multiple items, space them appropriately to avoid overlap (at least 50px apart for shapes, 1 tile apart for tiles)

**MULTIPLE ITEMS:**
- When creating multiple shapes (e.g., "7 colored squares"), call createShape MULTIPLE TIMES, once for each
- For shapes: space horizontally (e.g., center-200, center-100, center, center+100, center+200)
- For tiles: space in a grid pattern within visible bounds

**SPECIAL PATTERNS:**
- RAINBOW COLORS: red (#FF0000), orange (#FF7F00), yellow (#FFFF00), green (#00FF00), blue (#0000FF), indigo (#4B0082), violet (#9400D3)

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

