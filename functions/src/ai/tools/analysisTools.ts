/**
 * Analysis Tools
 * Analyze canvas content, detect patterns, and suggest improvements
 * PR-32: AI Game-Aware Enhancement
 */

import * as admin from 'firebase-admin';
import { ToolDefinition, ToolResult } from '../toolRegistry';
import { checkUserPermission } from '../safety';

/**
 * Analyze Tilemap Tool
 * Analyzes the current tilemap and returns statistics
 */
export const analyzeTilemapTool: ToolDefinition = {
  name: 'analyzeTilemap',
  description: 'Analyze the current tilemap and return statistics: tile distribution, empty spaces, connected regions, and suggestions for improvement',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Get tilemap data
      const db = admin.database();
      const tilemapRef = db.ref(`canvases/${context.canvasId}/tilemap`);
      const tilemapSnap = await tilemapRef.once('value');
      const tilemapData = tilemapSnap.val();

      if (!tilemapData) {
        return {
          success: true,
          message: 'No tilemap exists yet. Create one with generateTilemap!',
          data: { empty: true },
        };
      }

      // Get tiles
      const tilesRef = db.ref(`canvases/${context.canvasId}/tilemap/tiles`);
      const tilesSnap = await tilesRef.once('value');
      const tiles = tilesSnap.val() || {};

      const width = tilemapData.width || 100;
      const height = tilemapData.height || 100;
      const totalCells = width * height;
      const tileCount = Object.keys(tiles).length;

      // Count tile types
      const tileTypes: Record<string, number> = {};
      for (const tile of Object.values(tiles) as any[]) {
        const type = tile.type || 'unknown';
        tileTypes[type] = (tileTypes[type] || 0) + 1;
      }

      // Calculate percentages
      const distribution = Object.entries(tileTypes).map(([type, count]) => ({
        type,
        count,
        percentage: ((count / tileCount) * 100).toFixed(1) + '%',
      }));

      // Analyze density
      const density = ((tileCount / totalCells) * 100).toFixed(1);
      const emptySpaces = totalCells - tileCount;

      // Generate suggestions
      const suggestions: string[] = [];

      if (tileCount === 0) {
        suggestions.push('Tilemap is empty. Use paintTileRegion or generateTilemap to add content.');
      } else if (tileCount < totalCells * 0.1) {
        suggestions.push('Tilemap is very sparse (< 10% filled). Consider generating more terrain.');
      } else if (tileCount > totalCells * 0.9) {
        suggestions.push('Tilemap is very dense (> 90% filled). Consider adding more empty/air spaces.');
      }

      // Check variety
      const uniqueTypes = Object.keys(tileTypes).length;
      if (uniqueTypes === 1) {
        suggestions.push('Only one tile type used. Add variety with different tile types.');
      } else if (uniqueTypes < 3) {
        suggestions.push('Limited tile variety. Consider adding more tile types for visual interest.');
      }

      // Check for dominant type
      const sortedTypes = distribution.sort((a, b) => b.count - a.count);
      if (sortedTypes.length > 0 && sortedTypes[0].count > tileCount * 0.8) {
        suggestions.push(`Tilemap is dominated by ${sortedTypes[0].type} tiles (${sortedTypes[0].percentage}). Add more variety.`);
      }

      return {
        success: true,
        message: `Analyzed ${width}x${height} tilemap with ${tileCount} tiles`,
        data: {
          dimensions: { width, height },
          totalCells,
          tileCount,
          emptySpaces,
          density: density + '%',
          distribution,
          uniqueTypes,
          suggestions,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to analyze tilemap: ${error.message}`,
      };
    }
  },
};

/**
 * Detect Patterns Tool
 * Identifies common game patterns in the canvas
 */
export const detectPatternsTool: ToolDefinition = {
  name: 'detectPatterns',
  description: 'Detect common game patterns in the canvas: platformer level, top-down dungeon, puzzle grid, etc. Returns detected pattern type with confidence score and reasoning.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Get canvas objects
      const db = admin.database();
      const objectsRef = db.ref(`canvases/${context.canvasId}/objects`);
      const objectsSnap = await objectsRef.once('value');
      const objects = objectsSnap.val() || {};

      // Get tilemap metadata
      const tilemapRef = db.ref(`canvases/${context.canvasId}/tilemap`);
      const tilemapSnap = await tilemapRef.once('value');
      const tilemapData = tilemapSnap.val();

      const objectArray = Object.values(objects) as any[];
      const objectCount = objectArray.length;

      // Detect game type
      let gameType = 'unknown';
      let confidence = 0;
      const reasoning: string[] = [];

      // Analyze object layout
      if (objectCount > 0) {
        const yPositions = objectArray.map(obj => obj.y || 0);
        const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
        const maxY = Math.max(...yPositions);
        const minY = Math.min(...yPositions);
        const yRange = maxY - minY;

        // Check for horizontal layers (platformer)
        const layers = new Set<number>();
        for (const y of yPositions) {
          layers.add(Math.floor(y / 100)); // 100px layer threshold
        }

        if (layers.size >= 3 && yRange > 300) {
          gameType = 'platformer';
          confidence = 0.7;
          reasoning.push(`${layers.size} horizontal layers detected`);
          reasoning.push('Objects distributed vertically (suggests gravity-based gameplay)');
        }

        // Check for grid pattern (puzzle/top-down)
        const xPositions = objectArray.map(obj => obj.x || 0);
        const xSpacing = new Map<number, number>();
        
        for (let i = 1; i < xPositions.length; i++) {
          const spacing = Math.round((xPositions[i] - xPositions[i - 1]) / 10) * 10;
          xSpacing.set(spacing, (xSpacing.get(spacing) || 0) + 1);
        }

        const maxSpacing = Math.max(...Array.from(xSpacing.values()));
        if (maxSpacing > objectCount * 0.3) {
          if (objectCount < 50) {
            gameType = 'puzzle';
            confidence = 0.65;
            reasoning.push('Regular grid pattern detected');
            reasoning.push('Low object count (typical for puzzle games)');
          } else {
            gameType = 'top-down';
            confidence = 0.6;
            reasoning.push('Grid-based layout detected');
          }
        }
      }

      // Analyze tilemap
      if (tilemapData) {
        const width = tilemapData.width || 0;
        const height = tilemapData.height || 0;
        const aspectRatio = width / height;

        if (aspectRatio > 2) {
          if (gameType === 'unknown' || confidence < 0.7) {
            gameType = 'platformer';
            confidence = Math.max(confidence, 0.6);
            reasoning.push('Wide aspect ratio suggests side-scrolling');
          }
        }

        if (width === height) {
          reasoning.push('Square tilemap (common in top-down games)');
          if (gameType === 'top-down') {
            confidence = Math.min(confidence + 0.1, 1.0);
          }
        }
      }

      // Default if nothing detected
      if (gameType === 'unknown') {
        confidence = 0.2;
        reasoning.push('Not enough content to detect specific pattern');
        reasoning.push('Add more objects or tilemap for better detection');
      }

      // Generate suggestions based on detected type
      const suggestions: string[] = [];
      
      switch (gameType) {
        case 'platformer':
          suggestions.push('Add platform terrain with generateTilemap (perlin-noise or cellular-automata)');
          suggestions.push('Place collectibles on platforms');
          suggestions.push('Add enemies or hazards');
          break;
        case 'top-down':
          suggestions.push('Generate dungeon layout with generateTilemap (cellular-automata)');
          suggestions.push('Add walls and boundaries');
          suggestions.push('Place doors and room transitions');
          break;
        case 'puzzle':
          suggestions.push('Create puzzle grid with regular spacing');
          suggestions.push('Add win condition indicators');
          suggestions.push('Consider adding UI elements');
          break;
        default:
          suggestions.push('Add more content to help detect game type');
          suggestions.push('Try generating a tilemap to establish level structure');
      }

      return {
        success: true,
        message: `Detected ${gameType} pattern with ${(confidence * 100).toFixed(0)}% confidence`,
        data: {
          gameType,
          confidence: (confidence * 100).toFixed(0) + '%',
          reasoning,
          suggestions,
          stats: {
            objectCount,
            tilemapSize: tilemapData ? { width: tilemapData.width, height: tilemapData.height } : null,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to detect patterns: ${error.message}`,
      };
    }
  },
};

/**
 * Suggest Improvement Tool
 * Analyzes canvas and suggests specific improvements
 */
export const suggestImprovementTool: ToolDefinition = {
  name: 'suggestImprovement',
  description: 'Analyze the current canvas and suggest specific improvements: missing elements, layout issues, variety improvements, etc.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Get canvas objects
      const db = admin.database();
      const objectsRef = db.ref(`canvases/${context.canvasId}/objects`);
      const objectsSnap = await objectsRef.once('value');
      const objects = objectsSnap.val() || {};

      // Get tilemap
      const tilemapRef = db.ref(`canvases/${context.canvasId}/tilemap`);
      const tilemapSnap = await tilemapRef.once('value');
      const tilemapData = tilemapSnap.val();

      const tilesRef = db.ref(`canvases/${context.canvasId}/tilemap/tiles`);
      const tilesSnap = await tilesRef.once('value');
      const tiles = tilesSnap.val() || {};

      const objectArray = Object.values(objects) as any[];
      const objectCount = objectArray.length;
      const tileCount = Object.keys(tiles).length;

      const improvements: string[] = [];
      const warnings: string[] = [];

      // Check for empty canvas
      if (objectCount === 0 && tileCount === 0) {
        improvements.push('Canvas is empty! Start by generating a tilemap or adding some objects.');
        improvements.push('Try: generateTilemap with perlin-noise for natural terrain');
        improvements.push('Or: Add shapes as placeholders for game objects');
        
        return {
          success: true,
          message: 'Canvas needs content',
          data: { improvements, warnings, priority: 'high' },
        };
      }

      // Check tilemap
      if (tileCount === 0) {
        improvements.push('No tilemap detected. Add terrain with generateTilemap.');
        improvements.push('Suggested: Use cellular-automata for caves or perlin-noise for landscapes');
      } else if (tilemapData) {
        const width = tilemapData.width || 0;
        const height = tilemapData.height || 0;
        const totalCells = width * height;
        const density = tileCount / totalCells;

        if (density < 0.05) {
          improvements.push(`Tilemap is very sparse (${(density * 100).toFixed(1)}% filled). Consider generating more terrain.`);
        }

        // Count tile types
        const tileTypes = new Set<string>();
        for (const tile of Object.values(tiles) as any[]) {
          tileTypes.add(tile.type || 'unknown');
        }

        if (tileTypes.size === 1) {
          improvements.push('Only one tile type used. Add variety with paintTileRegion using different types.');
        }
      }

      // Check object variety
      if (objectCount > 0) {
        const objectTypes = new Set<string>();
        for (const obj of objectArray) {
          objectTypes.add(obj.type || 'unknown');
        }

        if (objectTypes.size === 1 && objectCount > 5) {
          improvements.push(`All ${objectCount} objects are the same type. Add variety with different shapes.`);
        }

        // Check for text objects (labels)
        const hasText = objectArray.some(obj => obj.type === 'text');
        if (!hasText && objectCount > 10) {
          improvements.push('Consider adding text labels for important areas (spawn point, goal, etc.)');
        }
      }

      // Check scale
      if (objectCount > 200) {
        warnings.push(`High object count (${objectCount}). Consider using tilemap for repetitive elements.`);
        improvements.push('Performance: Use tilemap for terrain instead of individual shapes');
      }

      if (tilemapData && tilemapData.width * tilemapData.height > 50000) {
        warnings.push('Large tilemap may impact performance. Consider reducing size.');
      }

      // General suggestions
      if (improvements.length === 0) {
        improvements.push('Canvas looks good! Consider adding:');
        improvements.push('- Animation for interactive objects');
        improvements.push('- Color variation for visual interest');
        improvements.push('- More detailed tilemap terrain');
      }

      const priority = warnings.length > 0 ? 'high' : improvements.length > 3 ? 'medium' : 'low';

      return {
        success: true,
        message: `Found ${improvements.length} improvement(s) and ${warnings.length} warning(s)`,
        data: {
          improvements,
          warnings,
          priority,
          stats: {
            objectCount,
            tileCount,
            canvasSize: tilemapData ? { width: tilemapData.width, height: tilemapData.height } : null,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to suggest improvements: ${error.message}`,
      };
    }
  },
};

