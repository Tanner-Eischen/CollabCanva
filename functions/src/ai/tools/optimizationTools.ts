/**
 * Optimization Tools
 * Analyze performance and suggest optimizations
 * PR-32: AI Game-Aware Enhancement
 */

import * as admin from 'firebase-admin';
import { ToolDefinition, ToolResult } from '../toolRegistry';
import { checkUserPermission } from '../safety';

/**
 * Analyze Performance Tool
 * Analyzes canvas performance and identifies bottlenecks
 */
export const analyzePerformanceTool: ToolDefinition = {
  name: 'analyzePerformance',
  description: 'Analyze canvas performance and identify bottlenecks. Returns FPS estimate, object count, memory usage, and specific optimization suggestions.',
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

      const objectCount = Object.keys(objects).length;
      const tileCount = Object.keys(tiles).length;

      // Estimate performance
      const performance = analyzeCanvasPerformance(
        objectCount,
        tileCount,
        tilemapData?.width,
        tilemapData?.height
      );

      return {
        success: true,
        message: `Performance analysis complete: ${performance.rating} (score: ${performance.score}/100)`,
        data: performance,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to analyze performance: ${error.message}`,
      };
    }
  },
};

/**
 * Estimate Export Size Tool
 * Estimates the export file size for different formats
 */
export const estimateExportSizeTool: ToolDefinition = {
  name: 'estimateExportSize',
  description: 'Estimate the export file size for different game engine formats (Generic JSON, Godot, Unity, Phaser).',
  parameters: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description: 'Export format to estimate',
        enum: ['generic', 'godot', 'unity', 'phaser'],
      },
    },
    required: [],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Get canvas data
      const db = admin.database();
      const objectsRef = db.ref(`canvases/${context.canvasId}/objects`);
      const objectsSnap = await objectsRef.once('value');
      const objects = objectsSnap.val() || {};

      const tilesRef = db.ref(`canvases/${context.canvasId}/tilemap/tiles`);
      const tilesSnap = await tilesRef.once('value');
      const tiles = tilesSnap.val() || {};

      const objectCount = Object.keys(objects).length;
      const tileCount = Object.keys(tiles).length;

      // Estimate sizes for each format
      const estimates = {
        generic: estimateGenericSize(objectCount, tileCount),
        godot: estimateGodotSize(objectCount, tileCount),
        unity: estimateUnitySize(objectCount, tileCount),
        phaser: estimatePhaserSize(objectCount, tileCount),
      };

      const selectedFormat = params.format || 'generic';
      const estimate = estimates[selectedFormat];

      // Size warnings
      const warnings: string[] = [];
      if (estimate.totalKB > 1000) {
        warnings.push('Export size > 1 MB. Consider optimizing.');
      }
      if (estimate.totalKB > 5000) {
        warnings.push('Very large export (> 5 MB). May be slow to load in game engine.');
      }

      return {
        success: true,
        message: `Estimated ${selectedFormat} export size: ${(estimate.totalKB / 1024).toFixed(2)} MB`,
        data: {
          format: selectedFormat,
          estimate,
          allEstimates: estimates,
          warnings,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to estimate export size: ${error.message}`,
      };
    }
  },
};

/**
 * Analyze canvas performance
 */
function analyzeCanvasPerformance(
  objectCount: number,
  tileCount: number,
  tilemapWidth?: number,
  tilemapHeight?: number
): {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  fps: number;
  objectCount: number;
  tileCount: number;
  drawCalls: number;
  memoryMB: number;
  bottlenecks: string[];
  suggestions: string[];
} {
  let score = 100;
  const bottlenecks: string[] = [];
  const suggestions: string[] = [];

  // Estimate FPS
  let fps = 60;
  if (objectCount > 1000) fps -= 20;
  else if (objectCount > 500) fps -= 10;
  else if (objectCount > 200) fps -= 5;

  if (tileCount > 50000) fps -= 15;
  else if (tileCount > 10000) fps -= 5;

  fps = Math.max(fps, 15);

  // Calculate score
  if (objectCount > 1000) {
    score -= 30;
    bottlenecks.push(`Too many objects (${objectCount})`);
    suggestions.push('Use tilemap for terrain instead of individual shapes');
  } else if (objectCount > 500) {
    score -= 15;
    bottlenecks.push(`High object count (${objectCount})`);
    suggestions.push('Consider grouping or caching static objects');
  }

  if (tileCount > 50000) {
    score -= 25;
    bottlenecks.push(`Very large tilemap (${tileCount} tiles)`);
    suggestions.push('Reduce tilemap size or implement chunking');
  } else if (tileCount > 10000) {
    score -= 10;
  }

  if (fps < 30) {
    score -= 30;
    bottlenecks.push(`Low FPS (${fps.toFixed(1)})`);
    suggestions.push('Reduce object count or enable viewport culling');
  } else if (fps < 45) {
    score -= 15;
  }

  // Estimate draw calls and memory
  const drawCalls = objectCount + Math.ceil(tileCount / 1000);
  const memoryMB = (objectCount * 0.001) + (tileCount * 0.0001);

  if (drawCalls > 2000) {
    score -= 20;
    bottlenecks.push(`Excessive draw calls (${drawCalls})`);
    suggestions.push('Batch objects with same properties');
  }

  score = Math.max(0, score);

  // Rating
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) {
    rating = 'excellent';
  } else if (score >= 60) {
    rating = 'good';
    if (suggestions.length === 0) {
      suggestions.push('Performance is good. Minor optimizations possible.');
    }
  } else if (score >= 40) {
    rating = 'fair';
    suggestions.push('Optimizations recommended for better performance');
  } else {
    rating = 'poor';
    suggestions.push('Significant optimizations required');
  }

  return {
    score,
    rating,
    fps,
    objectCount,
    tileCount,
    drawCalls,
    memoryMB,
    bottlenecks,
    suggestions
  };
}

/**
 * Estimate Generic JSON export size
 */
function estimateGenericSize(objectCount: number, tileCount: number): {
  objectsKB: number;
  tilemapKB: number;
  metadataKB: number;
  totalKB: number;
} {
  // JSON is verbose, ~200 bytes per object
  const objectsKB = (objectCount * 0.2);
  
  // Tiles are simpler, ~50 bytes each
  const tilemapKB = (tileCount * 0.05);
  
  // Metadata and schema
  const metadataKB = 2;

  return {
    objectsKB: parseFloat(objectsKB.toFixed(2)),
    tilemapKB: parseFloat(tilemapKB.toFixed(2)),
    metadataKB,
    totalKB: parseFloat((objectsKB + tilemapKB + metadataKB).toFixed(2))
  };
}

/**
 * Estimate Godot export size
 */
function estimateGodotSize(objectCount: number, tileCount: number): {
  sceneKB: number;
  assetsKB: number;
  totalKB: number;
} {
  // .tscn format is text-based, ~150 bytes per node
  const sceneKB = (objectCount * 0.15) + (tileCount * 0.03);
  
  // Assume some assets are referenced
  const assetsKB = 10; // Placeholder for external assets

  return {
    sceneKB: parseFloat(sceneKB.toFixed(2)),
    assetsKB,
    totalKB: parseFloat((sceneKB + assetsKB).toFixed(2))
  };
}

/**
 * Estimate Unity export size
 */
function estimateUnitySize(objectCount: number, tileCount: number): {
  prefabKB: number;
  assetsKB: number;
  totalKB: number;
} {
  // Prefab format is YAML-based
  const prefabKB = (objectCount * 0.18) + (tileCount * 0.04);
  
  // Assets
  const assetsKB = 15;

  return {
    prefabKB: parseFloat(prefabKB.toFixed(2)),
    assetsKB,
    totalKB: parseFloat((prefabKB + assetsKB).toFixed(2))
  };
}

/**
 * Estimate Phaser export size
 */
function estimatePhaserSize(objectCount: number, tileCount: number): {
  sceneKB: number;
  atlasKB: number;
  totalKB: number;
} {
  // Scene JSON
  const sceneKB = (objectCount * 0.12) + (tileCount * 0.03);
  
  // Texture atlas
  const atlasKB = 5;

  return {
    sceneKB: parseFloat(sceneKB.toFixed(2)),
    atlasKB,
    totalKB: parseFloat((sceneKB + atlasKB).toFixed(2))
  };
}


