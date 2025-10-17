/**
 * Shape Tools
 * Create, delete, and modify shapes
 * PR-30: Task 2.1
 */

import * as admin from 'firebase-admin';
import { ToolDefinition, ToolResult } from '../toolRegistry';
import {
  validateShapeType,
  validateColor,
  validateCoordinates,
  validateDimensions,
  validateShapeIds,
  sanitizeString,
} from '../validation';
import { checkShapeLimit, checkUserPermission } from '../safety';

/**
 * Generate unique shape ID
 */
function generateShapeId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create Shape Tool
 * Creates one or more shapes on the canvas
 */
export const createShapeTool: ToolDefinition = {
  name: 'createShape',
  description: 'Create a new shape on the canvas. Can create rectangles, circles, ellipses, polygons, stars, lines, and text.',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Shape type',
        enum: ['rectangle', 'circle', 'ellipse', 'polygon', 'star', 'line', 'text', 'rounded-rect'],
      },
      x: {
        type: 'number',
        description: 'X coordinate (0-5000)',
      },
      y: {
        type: 'number',
        description: 'Y coordinate (0-5000)',
      },
      width: {
        type: 'number',
        description: 'Width in pixels (1-2000)',
      },
      height: {
        type: 'number',
        description: 'Height in pixels (1-2000)',
      },
      color: {
        type: 'string',
        description: 'Fill color (hex like #FF0000 or named like "red")',
      },
      strokeColor: {
        type: 'string',
        description: 'Stroke/border color (optional)',
      },
      strokeWidth: {
        type: 'number',
        description: 'Stroke width in pixels (optional)',
      },
      text: {
        type: 'string',
        description: 'Text content (only for text shapes)',
      },
      rotation: {
        type: 'number',
        description: 'Rotation angle in degrees (optional)',
      },
    },
    required: ['type', 'x', 'y'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate shape limit
      const limitCheck = await checkShapeLimit(context.canvasId, 1);
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.reason };
      }

      // Validate type
      if (!validateShapeType(params.type)) {
        return { success: false, error: `Invalid shape type: ${params.type}` };
      }

      // Validate coordinates
      const coordCheck = validateCoordinates(params.x, params.y);
      if (!coordCheck.valid) {
        return { success: false, error: coordCheck.error };
      }

      // Set default dimensions if not provided
      const width = params.width || (params.type === 'circle' ? 100 : 150);
      const height = params.height || (params.type === 'circle' ? 100 : 100);

      // Validate dimensions
      const dimCheck = validateDimensions(width, height);
      if (!dimCheck.valid) {
        return { success: false, error: dimCheck.error };
      }

      // Validate color if provided
      if (params.color && !validateColor(params.color)) {
        return { success: false, error: `Invalid color: ${params.color}` };
      }

      // Build compressed shape data (matches client format)
      const shapeId = generateShapeId();
      
      // Map type to type code
      let typeCode: 'r' | 'c' | 't' | 'l' | 'pg' | 'st' | 'rr' = 'r';
      switch (params.type) {
        case 'rectangle': typeCode = 'r'; break;
        case 'circle': typeCode = 'c'; break;
        case 'text': typeCode = 't'; break;
        case 'line': typeCode = 'l'; break;
        case 'polygon': typeCode = 'pg'; break;
        case 'star': typeCode = 'st'; break;
        case 'rounded-rect': typeCode = 'rr'; break;
      }

      const shapeData: any = {
        t: typeCode,
        x: Math.round(params.x),
        y: Math.round(params.y),
        w: Math.round(width),
        h: Math.round(height),
        f: params.color || '#3B82F6FF', // Default blue with alpha
        z: Date.now(), // z-index
      };

      // Add rotation if present
      if (params.rotation) {
        shapeData.rot = Math.round(params.rotation);
      }

      // Add stroke properties if present
      if (params.strokeColor) {
        shapeData.s = params.strokeColor;
      }
      if (params.strokeWidth) {
        shapeData.sw = Math.round(params.strokeWidth);
      }

      // Add type-specific properties
      if (params.type === 'text') {
        shapeData.txt = sanitizeString(params.text || 'Text', 500);
        shapeData.fs = 24; // fontSize
        shapeData.ff = 'Inter, sans-serif'; // fontFamily
      }

      if (params.type === 'rounded-rect') {
        shapeData.cr = 10; // cornerRadius
      }

      if (params.type === 'star') {
        shapeData.pts = 5; // points
      }

      if (params.type === 'polygon') {
        shapeData.sides = 6;
      }

      // Write to Firebase (canvas/objects path to match client)
      const db = admin.database();
      await db.ref(`canvas/${context.canvasId}/objects/${shapeId}`).set(shapeData);

      return {
        success: true,
        message: `Created ${params.type} at (${params.x}, ${params.y})`,
        data: { shapeId, type: params.type },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create shape: ${error.message}`,
      };
    }
  },
};

/**
 * Delete Shapes Tool
 * Deletes one or more shapes from the canvas
 */
export const deleteShapesTool: ToolDefinition = {
  name: 'deleteShapes',
  description: 'Delete one or more shapes from the canvas. Requires shape IDs.',
  parameters: {
    type: 'object',
    properties: {
      shapeIds: {
        type: 'array',
        description: 'Array of shape IDs to delete',
        items: { type: 'string' },
      },
      confirm: {
        type: 'boolean',
        description: 'Set to true to confirm deletion (required if deleting >10 shapes)',
      },
    },
    required: ['shapeIds'],
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

      // Require confirmation for large deletions
      if (params.shapeIds.length > 10 && !params.confirm) {
        return {
          success: false,
          error: `Deleting ${params.shapeIds.length} shapes requires confirmation. Add confirm=true to proceed.`,
        };
      }

      const db = admin.database();
      const updates: any = {};

      // Delete each shape from canvas/objects
      for (const shapeId of params.shapeIds) {
        updates[`canvas/${context.canvasId}/objects/${shapeId}`] = null;
      }

      await db.ref().update(updates);

      return {
        success: true,
        message: `Deleted ${params.shapeIds.length} shape(s)`,
        data: { deletedCount: params.shapeIds.length },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete shapes: ${error.message}`,
      };
    }
  },
};

/**
 * Modify Shape Tool
 * Modifies properties of an existing shape
 */
export const modifyShapeTool: ToolDefinition = {
  name: 'modifyShape',
  description: 'Modify properties of an existing shape (color, size, position, etc.)',
  parameters: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: 'ID of the shape to modify',
      },
      properties: {
        type: 'object',
        description: 'Properties to modify',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          fill: { type: 'string' },
          stroke: { type: 'string' },
          strokeWidth: { type: 'number' },
          rotation: { type: 'number' },
          opacity: { type: 'number' },
          text: { type: 'string' },
        },
      },
    },
    required: ['shapeId', 'properties'],
  },
  execute: async (params, context): Promise<ToolResult> => {
    try {
      // Validate permissions
      const permCheck = await checkUserPermission(context.userId, context.canvasId);
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }

      // Validate shape exists
      const db = admin.database();
      const shapeRef = db.ref(`canvas/${context.canvasId}/objects/${params.shapeId}`);
      const snapshot = await shapeRef.once('value');
      
      if (!snapshot.exists()) {
        return { success: false, error: `Shape ${params.shapeId} not found` };
      }

      // Validate modifications
      const updates: any = {};
      const props = params.properties;

      if (props.x !== undefined || props.y !== undefined) {
        const x = props.x ?? snapshot.val().x;
        const y = props.y ?? snapshot.val().y;
        const coordCheck = validateCoordinates(x, y);
        if (!coordCheck.valid) {
          return { success: false, error: coordCheck.error };
        }
        if (props.x !== undefined) updates.x = props.x;
        if (props.y !== undefined) updates.y = props.y;
      }

      if (props.width !== undefined || props.height !== undefined) {
        const width = props.width ?? snapshot.val().width;
        const height = props.height ?? snapshot.val().height;
        const dimCheck = validateDimensions(width, height);
        if (!dimCheck.valid) {
          return { success: false, error: dimCheck.error };
        }
        if (props.width !== undefined) updates.width = props.width;
        if (props.height !== undefined) updates.height = props.height;
      }

      if (props.fill && !validateColor(props.fill)) {
        return { success: false, error: `Invalid fill color: ${props.fill}` };
      }

      if (props.stroke && !validateColor(props.stroke)) {
        return { success: false, error: `Invalid stroke color: ${props.stroke}` };
      }

      // Apply allowed modifications
      const allowedProps = ['fill', 'stroke', 'strokeWidth', 'rotation', 'opacity', 'text'];
      for (const key of allowedProps) {
        if (props[key] !== undefined) {
          if (key === 'text') {
            updates[key] = sanitizeString(props[key], 500);
          } else {
            updates[key] = props[key];
          }
        }
      }

      // Add metadata
      updates.modifiedBy = context.userId;
      updates.modifiedAt = Date.now();

      // Apply updates
      await shapeRef.update(updates);

      return {
        success: true,
        message: `Modified shape ${params.shapeId}`,
        data: { shapeId: params.shapeId, modifications: Object.keys(updates) },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to modify shape: ${error.message}`,
      };
    }
  },
};

