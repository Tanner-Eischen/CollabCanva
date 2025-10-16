/**
 * Transform Tools
 * Move, resize, and rotate shapes
 * PR-30: Task 2.2
 */

import * as admin from 'firebase-admin';
import { ToolDefinition, ToolResult } from '../toolRegistry';
import {
  validateShapeIds,
  validateCoordinates,
  validateDimensions,
  validateRotation,
} from '../validation';
import { checkUserPermission, clampToCanvas } from '../safety';

/**
 * Move Shapes Tool
 * Moves one or more shapes to a new position or by an offset
 */
export const moveShapesTool: ToolDefinition = {
  name: 'moveShapes',
  description: 'Move one or more shapes. Can move to absolute position or by relative offset.',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        description: 'Array of shape IDs to move',
        items: { type: 'string' },
      },
      mode: {
        type: 'string',
        description: 'Move mode: "absolute" (to specific position) or "relative" (by offset)',
        enum: ['absolute', 'relative'],
      },
      x: {
        type: 'number',
        description: 'Target X coordinate or X offset',
      },
      y: {
        type: 'number',
        description: 'Target Y coordinate or Y offset',
      },
    },
    required: ['shapeIds', 'mode', 'x', 'y'],
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
      const updates: any = {};
      let movedCount = 0;

      // Process each shape
      for (const shapeId of params.shapeIds) {
        const shapeRef = db.ref(`canvases/${context.canvasId}/shapes/${shapeId}`);
        const snapshot = await shapeRef.once('value');
        
        if (!snapshot.exists()) {
          continue; // Skip non-existent shapes
        }

        const shape = snapshot.val();
        let newX: number;
        let newY: number;

        if (params.mode === 'absolute') {
          newX = params.x;
          newY = params.y;
        } else {
          // Relative movement
          newX = shape.x + params.x;
          newY = shape.y + params.y;
        }

        // Validate and clamp coordinates
        const coordCheck = validateCoordinates(newX, newY);
        if (!coordCheck.valid) {
          // Clamp to safe bounds instead of failing
          const clamped = clampToCanvas(newX, newY);
          newX = clamped.x;
          newY = clamped.y;
        }

        updates[`canvases/${context.canvasId}/shapes/${shapeId}/x`] = newX;
        updates[`canvases/${context.canvasId}/shapes/${shapeId}/y`] = newY;
        updates[`canvases/${context.canvasId}/shapes/${shapeId}/modifiedBy`] = context.userId;
        updates[`canvases/${context.canvasId}/shapes/${shapeId}/modifiedAt`] = Date.now();
        movedCount++;
      }

      if (movedCount === 0) {
        return { success: false, error: 'No valid shapes found to move' };
      }

      // Apply all updates in batch
      await db.ref().update(updates);

      const mode = params.mode === 'absolute' ? `to (${params.x}, ${params.y})` : `by (${params.x}, ${params.y})`;
      return {
        success: true,
        message: `Moved ${movedCount} shape(s) ${mode}`,
        data: { movedCount },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to move shapes: ${error.message}`,
      };
    }
  },
};

/**
 * Resize Shape Tool
 * Resizes a single shape
 */
export const resizeShapeTool: ToolDefinition = {
  name: 'resizeShape',
  description: 'Resize a shape to new dimensions',
  parameters: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: 'ID of the shape to resize',
      },
      width: {
        type: 'number',
        description: 'New width in pixels (1-2000)',
      },
      height: {
        type: 'number',
        description: 'New height in pixels (1-2000)',
      },
      maintainAspectRatio: {
        type: 'boolean',
        description: 'If true, scale proportionally (optional)',
      },
    },
    required: ['shapeId'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Get current shape
      const db = admin.database();
      const shapeRef = db.ref(`canvases/${context.canvasId}/shapes/${params.shapeId}`);
      const snapshot = await shapeRef.once('value');
      
      if (!snapshot.exists()) {
        return { success: false, error: `Shape ${params.shapeId} not found` };
      }

      const shape = snapshot.val();
      let newWidth = params.width || shape.width;
      let newHeight = params.height || shape.height;

      // Maintain aspect ratio if requested
      if (params.maintainAspectRatio && params.width && !params.height) {
        const aspectRatio = shape.height / shape.width;
        newHeight = newWidth * aspectRatio;
      } else if (params.maintainAspectRatio && params.height && !params.width) {
        const aspectRatio = shape.width / shape.height;
        newWidth = newHeight * aspectRatio;
      }

      // Validate dimensions
      const dimCheck = validateDimensions(newWidth, newHeight);
      if (!dimCheck.valid) {
        return { success: false, error: dimCheck.error };
      }

      // Apply resize
      await shapeRef.update({
        width: newWidth,
        height: newHeight,
        modifiedBy: context.userId,
        modifiedAt: Date.now(),
      });

      return {
        success: true,
        message: `Resized shape to ${Math.round(newWidth)}x${Math.round(newHeight)}`,
        data: { shapeId: params.shapeId, width: newWidth, height: newHeight },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to resize shape: ${error.message}`,
      };
    }
  },
};

/**
 * Rotate Shapes Tool
 * Rotates one or more shapes
 */
export const rotateShapesTool: ToolDefinition = {
  name: 'rotateShapes',
  description: 'Rotate one or more shapes by an angle',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        description: 'Array of shape IDs to rotate',
        items: { type: 'string' },
      },
      mode: {
        type: 'string',
        description: 'Rotation mode: "absolute" (set to angle) or "relative" (rotate by angle)',
        enum: ['absolute', 'relative'],
      },
      angle: {
        type: 'number',
        description: 'Rotation angle in degrees',
      },
    },
    required: ['shapeIds', 'mode', 'angle'],
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

      // Validate angle
      const angleCheck = validateRotation(params.angle);
      if (!angleCheck.valid) {
        return { success: false, error: angleCheck.error };
      }

      const db = admin.database();
      const updates: any = {};
      let rotatedCount = 0;

      // Process each shape
      for (const shapeId of params.shapeIds) {
        const shapeRef = db.ref(`canvases/${context.canvasId}/shapes/${shapeId}`);
        const snapshot = await shapeRef.once('value');
        
        if (!snapshot.exists()) {
          continue;
        }

        const shape = snapshot.val();
        let newRotation: number;

        if (params.mode === 'absolute') {
          newRotation = params.angle;
        } else {
          // Relative rotation
          newRotation = (shape.rotation || 0) + params.angle;
        }

        // Normalize to 0-360
        newRotation = ((newRotation % 360) + 360) % 360;

        updates[`canvases/${context.canvasId}/shapes/${shapeId}/rotation`] = newRotation;
        updates[`canvases/${context.canvasId}/shapes/${shapeId}/modifiedBy`] = context.userId;
        updates[`canvases/${context.canvasId}/shapes/${shapeId}/modifiedAt`] = Date.now();
        rotatedCount++;
      }

      if (rotatedCount === 0) {
        return { success: false, error: 'No valid shapes found to rotate' };
      }

      // Apply all updates in batch
      await db.ref().update(updates);

      const mode = params.mode === 'absolute' ? `to ${params.angle}°` : `by ${params.angle}°`;
      return {
        success: true,
        message: `Rotated ${rotatedCount} shape(s) ${mode}`,
        data: { rotatedCount },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to rotate shapes: ${error.message}`,
      };
    }
  },
};

