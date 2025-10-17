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
  fillRegion,
  clearRegion,
  clearAllTiles,
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
 * Erases tiles in a rectangular region (only painted tiles, not empty space)
 */
export const eraseTileRegionTool: ToolDefinition = {
  name: 'eraseTileRegion',
  description: 'Erase painted tiles in a specific rectangular region. Only erases tiles that actually exist in that region, not empty space.',
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
 * Erase All Painted Tiles Tool
 * Erases all existing tiles on the tilemap (only painted tiles, not empty space)
 */
export const eraseAllTilesTool: ToolDefinition = {
  name: 'eraseAllTiles',
  description: 'Erase all painted tiles on the tilemap. Only erases tiles that actually exist, not empty space.',
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

      // Execute clear all tiles
      const result = await clearAllTiles(context.canvasId);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.tileCount === 0) {
        return {
          success: true,
          message: 'No tiles to erase - tilemap is already empty',
          data: { tileCount: 0 },
        };
      }

      return {
        success: true,
        message: `Erased ${result.tileCount} painted tiles in ${result.batchCount} batch(es)`,
        data: { tileCount: result.tileCount, batchCount: result.batchCount },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to erase all tiles: ${error.message}`,
      };
    }
  },
};

/**
 * Generate Tilemap Tool
 * Generates procedural tilemaps using various advanced algorithms
 * PR-32: Enhanced with Perlin Noise, Cellular Automata, WFC, Random Walk
 */
export const generateTilemapTool: ToolDefinition = {
  name: 'generateTilemap',
  description: 'Generate a procedural tilemap using advanced algorithms: perlin-noise (natural terrain), cellular-automata (caves/dungeons), wave-function-collapse (constrained generation), random-walk (paths/rivers), or simple noise/island',
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
        enum: ['perlin-noise', 'cellular-automata', 'wave-function-collapse', 'random-walk', 'noise', 'caves', 'paths', 'island'],
      },
      // Perlin Noise parameters
      scale: {
        type: 'number',
        description: 'Noise scale - controls feature size (0.01-1.0, default: 0.1). Smaller = larger features',
      },
      octaves: {
        type: 'number',
        description: 'Number of noise layers for detail (1-8, default: 4). Higher = more detail',
      },
      persistence: {
        type: 'number',
        description: 'Amplitude decay per octave (0-1, default: 0.5). Higher = rougher terrain',
      },
      // Cellular Automata parameters
      initialDensity: {
        type: 'number',
        description: 'Starting fill ratio for caves (0-1, default: 0.45). Higher = more walls',
      },
      iterations: {
        type: 'number',
        description: 'Number of simulation steps for caves (1-10, default: 5)',
      },
      connectRegions: {
        type: 'boolean',
        description: 'Connect disconnected cave regions with corridors (default: true)',
      },
      // WFC parameters
      wfcTileset: {
        type: 'string',
        description: 'Tileset for wave function collapse',
        enum: ['platform', 'dungeon', 'terrain'],
      },
      // Random Walk parameters
      pathWidth: {
        type: 'number',
        description: 'Path width for random walk (1-10, default: 2)',
      },
      pathSteps: {
        type: 'number',
        description: 'Number of steps in path (default: 100)',
      },
      smooth: {
        type: 'boolean',
        description: 'Smooth path with curves (default: false)',
      },
      // Legacy parameters
      fillProbability: {
        type: 'number',
        description: 'Fill probability for legacy caves algorithm (default: 0.45)',
      },
      // Common parameters
      seed: {
        type: 'number',
        description: 'Random seed for reproducible generation',
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
      let algorithmDetails = '';
      
      switch (params.algorithm) {
        case 'perlin-noise': {
          const { generatePerlinTilemap } = await import('../tilemapGenerators');
          tiles = generatePerlinTilemap(params.width, params.height, {
            scale: params.scale || 0.1,
            octaves: params.octaves || 4,
            persistence: params.persistence || 0.5,
            lacunarity: 2.0,
            seed: params.seed,
          });
          algorithmDetails = `scale=${params.scale || 0.1}, octaves=${params.octaves || 4}`;
          break;
        }

        case 'cellular-automata': {
          const { generateCellularTilemap } = await import('../tilemapGenerators');
          tiles = generateCellularTilemap(params.width, params.height, {
            initialDensity: params.initialDensity || 0.45,
            birthLimit: 4,
            deathLimit: 3,
            iterations: params.iterations || 5,
            seed: params.seed,
          }, {
            connectRegions: params.connectRegions !== false,
            removeIslands: true,
          });
          algorithmDetails = `density=${params.initialDensity || 0.45}, iterations=${params.iterations || 5}`;
          break;
        }

        case 'wave-function-collapse': {
          const { generateWFCTilemap } = await import('../tilemapGenerators');
          const tileset = params.wfcTileset || 'terrain';
          tiles = generateWFCTilemap(params.width, params.height, tileset, params.seed);
          
          if (!tiles) {
            return { 
              success: false, 
              error: 'Wave Function Collapse failed to generate a valid tilemap. Try a smaller size or different tileset.' 
            };
          }
          algorithmDetails = `tileset=${tileset}`;
          break;
        }

        case 'random-walk': {
          const { generateRandomWalkTilemap } = await import('../tilemapGenerators');
          tiles = generateRandomWalkTilemap(params.width, params.height, {
            steps: params.pathSteps || 100,
            turnProbability: 0.2,
            branchProbability: 0.05,
            width: params.pathWidth || 2,
            seed: params.seed,
          }, {
            smooth: params.smooth || false,
          });
          algorithmDetails = `width=${params.pathWidth || 2}, steps=${params.pathSteps || 100}`;
          break;
        }

        // Legacy algorithms
        case 'noise':
          tiles = generateNoiseTerrain(params.width, params.height, {
            scale: params.scale || 0.1,
          });
          algorithmDetails = 'legacy noise';
          break;

        case 'caves':
          tiles = generateCellularCaves(params.width, params.height, {
            fillProbability: params.fillProbability || 0.45,
          });
          algorithmDetails = 'legacy caves';
          break;

        case 'paths':
          tiles = generateRandomWalk(params.width, params.height, {
            pathWidth: params.pathWidth || 1,
          });
          algorithmDetails = 'legacy paths';
          break;

        case 'island':
          tiles = generateIsland(params.width, params.height);
          algorithmDetails = 'island';
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
        generationAlgorithm: params.algorithm,
        generationParams: algorithmDetails,
      });

      // Batch set tiles
      const { batchSetTiles } = await import('../../services/tilemapBatch');
      const result = await batchSetTiles(context.canvasId, tiles);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        message: `Generated ${params.width}x${params.height} tilemap using ${params.algorithm} algorithm (${algorithmDetails}). Placed ${result.tileCount} tiles in ${result.batchCount} batches.`,
        data: {
          width: params.width,
          height: params.height,
          algorithm: params.algorithm,
          algorithmDetails,
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

