/**
 * Tilemap Tools
 * Paint, erase, and generate tilemaps
 * PR-30: Task 4.3
 */

import * as admin from 'firebase-admin';
import { ToolDefinition, ToolResult } from '../toolRegistry';
import { validateTileType, validateTileCoords } from '../validation';
import {
  checkUserPermission,
  checkTileOperationLimit,
  checkTilemapDimensions,
} from '../safety';
import {
  batchSetTiles,
  fillRegion,
  clearRegion,
  getTileCountInRegion,
} from '../../services/tilemapBatch';
import {
  generateNoiseTerrain,
  generateCellularCaves,
  generateRandomWalk,
  generateIsland,
} from '../tilemapGenerators';

/**
 * Paint Tile Region Tool
 * Paints a rectangular region with tiles
 */
export const paintTileRegionTool: ToolDefinition = {
  name: 'paintTileRegion',
  description: 'Paint a rectangular region of tiles on the tilemap',
  parameters: {
    type: 'object',
    properties: {
      startRow: {
        type: 'number',
        description: 'Starting row coordinate (0-1000)',
      },
      startCol: {
        type: 'number',
        description: 'Starting column coordinate (0-1000)',
      },
      endRow: {
        type: 'number',
        description: 'Ending row coordinate (0-1000)',
      },
      endCol: {
        type: 'number',
        description: 'Ending column coordinate (0-1000)',
      },
      tileType: {
        type: 'string',
        description: 'Tile type to paint',
        enum: ['grass', 'dirt', 'water', 'stone', 'flower'],
      },
    },
    required: ['startRow', 'startCol', 'endRow', 'endCol', 'tileType'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate coordinates
      const startCheck = validateTileCoords(params.startRow, params.startCol);
      if (!startCheck.valid) {
        return { success: false, error: startCheck.error };
      }

      const endCheck = validateTileCoords(params.endRow, params.endCol);
      if (!endCheck.valid) {
        return { success: false, error: endCheck.error };
      }

      // Validate tile type
      if (!validateTileType(params.tileType)) {
        return { success: false, error: `Invalid tile type: ${params.tileType}` };
      }

      // Check tile operation limit
      const tileCount = getTileCountInRegion(
        params.startRow,
        params.startCol,
        params.endRow,
        params.endCol
      );
      const limitCheck = checkTileOperationLimit(tileCount);
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.reason };
      }

      // Execute batch fill
      const result = await fillRegion(
        context.canvasId,
        params.startRow,
        params.startCol,
        params.endRow,
        params.endCol,
        params.tileType
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        message: `Painted ${result.tileCount} ${params.tileType} tiles in ${result.batchCount} batch(es)`,
        data: { tileCount: result.tileCount, batchCount: result.batchCount },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to paint tile region: ${error.message}`,
      };
    }
  },
};

/**
 * Erase Tile Region Tool
 * Erases tiles in a rectangular region
 */
export const eraseTileRegionTool: ToolDefinition = {
  name: 'eraseTileRegion',
  description: 'Erase tiles in a rectangular region',
  parameters: {
    type: 'object',
    properties: {
      startRow: {
        type: 'number',
        description: 'Starting row coordinate (0-1000)',
      },
      startCol: {
        type: 'number',
        description: 'Starting column coordinate (0-1000)',
      },
      endRow: {
        type: 'number',
        description: 'Ending row coordinate (0-1000)',
      },
      endCol: {
        type: 'number',
        description: 'Ending column coordinate (0-1000)',
      },
    },
    required: ['startRow', 'startCol', 'endRow', 'endCol'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate coordinates
      const startCheck = validateTileCoords(params.startRow, params.startCol);
      if (!startCheck.valid) {
        return { success: false, error: startCheck.error };
      }

      const endCheck = validateTileCoords(params.endRow, params.endCol);
      if (!endCheck.valid) {
        return { success: false, error: endCheck.error };
      }

      // Check tile operation limit
      const tileCount = getTileCountInRegion(
        params.startRow,
        params.startCol,
        params.endRow,
        params.endCol
      );
      const limitCheck = checkTileOperationLimit(tileCount);
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.reason };
      }

      // Execute batch clear
      const result = await clearRegion(
        context.canvasId,
        params.startRow,
        params.startCol,
        params.endRow,
        params.endCol
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        message: `Erased ${result.tileCount} tiles in ${result.batchCount} batch(es)`,
        data: { tileCount: result.tileCount, batchCount: result.batchCount },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to erase tile region: ${error.message}`,
      };
    }
  },
};

/**
 * Generate Tilemap Tool
 * Generates procedural tilemaps using various algorithms
 */
export const generateTilemapTool: ToolDefinition = {
  name: 'generateTilemap',
  description: 'Generate a procedural tilemap using noise, caves, paths, or island algorithms',
  parameters: {
    type: 'object',
    properties: {
      width: {
        type: 'number',
        description: 'Tilemap width in tiles (1-500)',
      },
      height: {
        type: 'number',
        description: 'Tilemap height in tiles (1-500)',
      },
      algorithm: {
        type: 'string',
        description: 'Generation algorithm',
        enum: ['noise', 'caves', 'paths', 'island'],
      },
      scale: {
        type: 'number',
        description: 'Noise scale for noise algorithm (default: 0.1)',
      },
      fillProbability: {
        type: 'number',
        description: 'Fill probability for caves algorithm (default: 0.45)',
      },
      pathWidth: {
        type: 'number',
        description: 'Path width for paths algorithm (default: 1)',
      },
    },
    required: ['width', 'height', 'algorithm'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate dimensions
      const dimCheck = checkTilemapDimensions(params.width, params.height);
      if (!dimCheck.allowed) {
        return { success: false, error: dimCheck.reason };
      }

      // Generate tiles based on algorithm
      let tiles;
      switch (params.algorithm) {
        case 'noise':
          tiles = generateNoiseTerrain(params.width, params.height, {
            scale: params.scale || 0.1,
          });
          break;

        case 'caves':
          tiles = generateCellularCaves(params.width, params.height, {
            fillProbability: params.fillProbability || 0.45,
          });
          break;

        case 'paths':
          tiles = generateRandomWalk(params.width, params.height, {
            pathWidth: params.pathWidth || 1,
          });
          break;

        case 'island':
          tiles = generateIsland(params.width, params.height);
          break;

        default:
          return { success: false, error: `Unknown algorithm: ${params.algorithm}` };
      }

      // Update tilemap metadata
      const db = admin.database();
      await db.ref(`canvases/${context.canvasId}/tilemap`).update({
        width: params.width,
        height: params.height,
        tileSize: 32,
        updatedAt: Date.now(),
        updatedBy: context.userId,
      });

      // Batch set tiles
      const { batchSetTiles } = await import('../../services/tilemapBatch');
      const result = await batchSetTiles(context.canvasId, tiles);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        message: `Generated ${params.width}x${params.height} tilemap using ${params.algorithm} algorithm (${result.tileCount} tiles in ${result.batchCount} batches)`,
        data: {
          width: params.width,
          height: params.height,
          algorithm: params.algorithm,
          tileCount: result.tileCount,
          batchCount: result.batchCount,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to generate tilemap: ${error.message}`,
      };
    }
  },
};

