/**
 * Query Tools
 * Get canvas state and information
 * PR-30: Task 3.1
 */

import * as admin from 'firebase-admin';
import { ToolDefinition, ToolResult } from '../toolRegistry';
import { checkUserPermission } from '../safety';
import { compressCanvasState } from '../contextBuilder';

/**
 * Get Canvas State Tool
 * Returns information about the current canvas
 */
export const getCanvasStateTool: ToolDefinition = {
  name: 'getCanvasState',
  description: 'Get current canvas state including shapes, tilemap info, and metadata',
  parameters: {
    type: 'object',
    properties: {
      includeShapes: {
        type: 'boolean',
        description: 'Include detailed shape information (default: true)',
      },
      includeTilemap: {
        type: 'boolean',
        description: 'Include tilemap information (default: true)',
      },
    },
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      const db = admin.database();
      const canvasRef = db.ref(`canvases/${context.canvasId}`);
      const snapshot = await canvasRef.once('value');

      if (!snapshot.exists()) {
        return { success: false, error: 'Canvas not found' };
      }

      const canvas = snapshot.val();
      const includeShapes = params.includeShapes !== false;
      const includeTilemap = params.includeTilemap !== false;

      // Build response data
      const data: any = {
        canvasId: context.canvasId,
        name: canvas.name || 'Untitled Canvas',
        createdAt: canvas.createdAt,
        mode: context.mode,
      };

      // Add shape information
      if (includeShapes && canvas.shapes) {
        const shapes = Object.values(canvas.shapes);
        data.shapeCount = shapes.length;
        data.shapesSummary = compressCanvasState(shapes as any[]);
        
        // Include type breakdown
        const typeCounts: Record<string, number> = {};
        shapes.forEach((shape: any) => {
          typeCounts[shape.type] = (typeCounts[shape.type] || 0) + 1;
        });
        data.shapeTypes = typeCounts;
      } else {
        data.shapeCount = 0;
      }

      // Add tilemap information
      if (includeTilemap && canvas.tilemap) {
        const tilemap = canvas.tilemap;
        data.tilemap = {
          width: tilemap.width || 0,
          height: tilemap.height || 0,
          tileSize: tilemap.tileSize || 32,
          totalTiles: (tilemap.width || 0) * (tilemap.height || 0),
          tileCount: tilemap.tiles ? Object.keys(tilemap.tiles).length : 0,
        };
      }

      // Add layer information
      if (canvas.layerOrder) {
        data.layerCount = canvas.layerOrder.length;
      }

      return {
        success: true,
        message: `Canvas has ${data.shapeCount} shape(s)`,
        data,
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get canvas state: ${error.message}`,
      };
    }
  },
};

/**
 * Get Selected Shapes Tool
 * Returns detailed information about selected shapes
 */
export const getSelectedShapesTool: ToolDefinition = {
  name: 'getSelectedShapes',
  description: 'Get detailed information about currently selected shapes',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      if (!context.selectedShapes || context.selectedShapes.length === 0) {
        return {
          success: true,
          message: 'No shapes currently selected',
          data: { selectedCount: 0, shapes: [] },
        };
      }

      const db = admin.database();
      const shapes: any[] = [];

      // Fetch each selected shape
      for (const shapeId of context.selectedShapes) {
        const snapshot = await db.ref(`canvases/${context.canvasId}/shapes/${shapeId}`).once('value');
        if (snapshot.exists()) {
          shapes.push(snapshot.val());
        }
      }

      // Build summary
      const summary = shapes.map(s => ({
        id: s.id,
        type: s.type,
        position: { x: s.x, y: s.y },
        size: { width: s.width, height: s.height },
        fill: s.fill,
        rotation: s.rotation || 0,
        text: s.text,
      }));

      return {
        success: true,
        message: `${shapes.length} shape(s) selected`,
        data: {
          selectedCount: shapes.length,
          shapes: summary,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get selected shapes: ${error.message}`,
      };
    }
  },
};

