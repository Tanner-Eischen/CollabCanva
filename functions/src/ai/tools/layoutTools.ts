/**
 * Layout Tools
 * Arrange, distribute, and align shapes
 * PR-30: Task 2.3
 */

import * as admin from 'firebase-admin';
import { ToolDefinition, ToolResult } from '../toolRegistry';
import { validateShapeIds, validateArrayLength } from '../validation';
import { checkUserPermission } from '../safety';

/**
 * Arrange Shapes Tool
 * Arranges shapes in a grid, row, or column
 */
export const arrangeShapesTool: ToolDefinition = {
  name: 'arrangeShapes',
  description: 'Arrange shapes in a grid, row, or column with consistent spacing',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        description: 'Array of shape IDs to arrange',
        items: { type: 'string' },
      },
      layout: {
        type: 'string',
        description: 'Layout type',
        enum: ['grid', 'row', 'column'],
      },
      spacing: {
        type: 'number',
        description: 'Space between shapes in pixels (default: 20)',
      },
      columns: {
        type: 'number',
        description: 'Number of columns (only for grid layout)',
      },
      startX: {
        type: 'number',
        description: 'Starting X coordinate (default: 100)',
      },
      startY: {
        type: 'number',
        description: 'Starting Y coordinate (default: 100)',
      },
    },
    required: ['shapeIds', 'layout'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate shape IDs
      const idsCheck = validateShapeIds(params.shapeIds);
      if (!idsCheck.valid) {
        return { success: false, error: idsCheck.error };
      }

      const db = admin.database();
      const spacing = params.spacing || 20;
      const startX = params.startX || 100;
      const startY = params.startY || 100;

      // Fetch all shapes
      const shapes: any[] = [];
      for (const shapeId of params.shapeIds) {
        const snapshot = await db.ref(`canvas/${context.canvasId}/objects/${shapeId}`).once('value');
        if (snapshot.exists()) {
          shapes.push({ id: shapeId, ...snapshot.val() });
        }
      }

      if (shapes.length === 0) {
        return { success: false, error: 'No valid shapes found to arrange' };
      }

      const updates: any = {};
      let currentX = startX;
      let currentY = startY;
      let maxRowHeight = 0;

      // Arrange based on layout type
      switch (params.layout) {
        case 'row':
          for (const shape of shapes) {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/x`] = currentX;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/y`] = startY;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
            currentX += shape.width + spacing;
          }
          break;

        case 'column':
          for (const shape of shapes) {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/x`] = startX;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/y`] = currentY;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
            currentY += shape.height + spacing;
          }
          break;

        case 'grid':
          const columns = params.columns || Math.ceil(Math.sqrt(shapes.length));
          let col = 0;
          
          for (const shape of shapes) {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/x`] = currentX;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/y`] = currentY;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
            
            maxRowHeight = Math.max(maxRowHeight, shape.height);
            currentX += shape.width + spacing;
            col++;

            // Move to next row
            if (col >= columns) {
              col = 0;
              currentX = startX;
              currentY += maxRowHeight + spacing;
              maxRowHeight = 0;
            }
          }
          break;
      }

      await db.ref().update(updates);

      return {
        success: true,
        message: `Arranged ${shapes.length} shapes in ${params.layout}`,
        data: { arrangedCount: shapes.length, layout: params.layout },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to arrange shapes: ${error.message}`,
      };
    }
  },
};

/**
 * Distribute Shapes Tool
 * Distributes shapes with equal spacing
 */
export const distributeShapesTool: ToolDefinition = {
  name: 'distributeShapes',
  description: 'Distribute shapes with equal spacing horizontally or vertically',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        description: 'Array of shape IDs to distribute',
        items: { type: 'string' },
      },
      direction: {
        type: 'string',
        description: 'Distribution direction',
        enum: ['horizontal', 'vertical'],
      },
    },
    required: ['shapeIds', 'direction'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate shape IDs (need at least 3 for distribution)
      const arrayCheck = validateArrayLength(params.shapeIds, 3, 100, 'shapeIds');
      if (!arrayCheck.valid) {
        return { success: false, error: arrayCheck.error || 'Need at least 3 shapes to distribute' };
      }

      const db = admin.database();

      // Fetch all shapes
      const shapes: any[] = [];
      for (const shapeId of params.shapeIds) {
        const snapshot = await db.ref(`canvas/${context.canvasId}/objects/${shapeId}`).once('value');
        if (snapshot.exists()) {
          shapes.push({ id: shapeId, ...snapshot.val() });
        }
      }

      if (shapes.length < 3) {
        return { success: false, error: 'Need at least 3 shapes to distribute' };
      }

      // Sort shapes by position
      if (params.direction === 'horizontal') {
        shapes.sort((a, b) => a.x - b.x);
      } else {
        shapes.sort((a, b) => a.y - b.y);
      }

      // Calculate total space and distribute
      const first = shapes[0];
      const last = shapes[shapes.length - 1];
      let totalSpace: number;
      
      if (params.direction === 'horizontal') {
        totalSpace = (last.x + last.width) - first.x;
      } else {
        totalSpace = (last.y + last.height) - first.y;
      }

      // Calculate spacing
      const totalShapeSize = shapes.reduce((sum, s) => 
        sum + (params.direction === 'horizontal' ? s.width : s.height), 0
      );
      const spacing = (totalSpace - totalShapeSize) / (shapes.length - 1);

      // Update positions
      const updates: any = {};
      let currentPos = params.direction === 'horizontal' ? first.x : first.y;

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        
        if (i === 0 || i === shapes.length - 1) {
          // Keep first and last in place
          currentPos += (params.direction === 'horizontal' ? shape.width : shape.height) + spacing;
          continue;
        }

        // Update middle shapes
        if (params.direction === 'horizontal') {
          updates[`canvas/${context.canvasId}/objects/${shape.id}/x`] = currentPos;
          currentPos += shape.width + spacing;
        } else {
          updates[`canvas/${context.canvasId}/objects/${shape.id}/y`] = currentPos;
          currentPos += shape.height + spacing;
        }

        updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
        updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
      }

      await db.ref().update(updates);

      return {
        success: true,
        message: `Distributed ${shapes.length} shapes ${params.direction}ly`,
        data: { distributedCount: shapes.length, direction: params.direction },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to distribute shapes: ${error.message}`,
      };
    }
  },
};

/**
 * Align Shapes Tool
 * Aligns shapes to a common edge or center
 */
export const alignShapesTool: ToolDefinition = {
  name: 'alignShapes',
  description: 'Align shapes to left, right, top, bottom, or center',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        description: 'Array of shape IDs to align',
        items: { type: 'string' },
      },
      alignment: {
        type: 'string',
        description: 'Alignment type',
        enum: ['left', 'right', 'top', 'bottom', 'center-horizontal', 'center-vertical'],
      },
    },
    required: ['shapeIds', 'alignment'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate shape IDs
      const idsCheck = validateShapeIds(params.shapeIds);
      if (!idsCheck.valid) {
        return { success: false, error: idsCheck.error };
      }

      const db = admin.database();

      // Fetch all shapes
      const shapes: any[] = [];
      for (const shapeId of params.shapeIds) {
        const snapshot = await db.ref(`canvas/${context.canvasId}/objects/${shapeId}`).once('value');
        if (snapshot.exists()) {
          shapes.push({ id: shapeId, ...snapshot.val() });
        }
      }

      if (shapes.length === 0) {
        return { success: false, error: 'No valid shapes found to align' };
      }

      // Calculate alignment reference
      let referenceValue: number;
      const updates: any = {};

      switch (params.alignment) {
        case 'left':
          referenceValue = Math.min(...shapes.map(s => s.x));
          shapes.forEach(shape => {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/x`] = referenceValue;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
          });
          break;

        case 'right':
          referenceValue = Math.max(...shapes.map(s => s.x + s.width));
          shapes.forEach(shape => {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/x`] = referenceValue - shape.width;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
          });
          break;

        case 'top':
          referenceValue = Math.min(...shapes.map(s => s.y));
          shapes.forEach(shape => {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/y`] = referenceValue;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
          });
          break;

        case 'bottom':
          referenceValue = Math.max(...shapes.map(s => s.y + s.height));
          shapes.forEach(shape => {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/y`] = referenceValue - shape.height;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
          });
          break;

        case 'center-horizontal':
          const avgCenterX = shapes.reduce((sum, s) => sum + (s.x + s.width / 2), 0) / shapes.length;
          shapes.forEach(shape => {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/x`] = avgCenterX - shape.width / 2;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
          });
          break;

        case 'center-vertical':
          const avgCenterY = shapes.reduce((sum, s) => sum + (s.y + s.height / 2), 0) / shapes.length;
          shapes.forEach(shape => {
            updates[`canvas/${context.canvasId}/objects/${shape.id}/y`] = avgCenterY - shape.height / 2;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedBy`] = context.userId;
            updates[`canvas/${context.canvasId}/objects/${shape.id}/modifiedAt`] = Date.now();
          });
          break;
      }

      await db.ref().update(updates);

      return {
        success: true,
        message: `Aligned ${shapes.length} shapes to ${params.alignment}`,
        data: { alignedCount: shapes.length, alignment: params.alignment },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to align shapes: ${error.message}`,
      };
    }
  },
};

