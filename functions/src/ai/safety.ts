/**
 * Safety Constraints
 * Enforces limits and prevents abuse
 * PR-30: Task 8.2
 */

import * as admin from 'firebase-admin';

// Limits
export const LIMITS = {
  MAX_SHAPES_PER_COMMAND: 100,
  MAX_TILES_PER_COMMAND: 10000,
  MAX_SHAPES_ON_CANVAS: 1000,
  MAX_TILES_ON_CANVAS: 100000,
  MAX_TILEMAP_WIDTH: 500,
  MAX_TILEMAP_HEIGHT: 500,
  COMMAND_TIMEOUT_MS: 25000,
  CANVAS_MIN_X: 0,
  CANVAS_MAX_X: 5000,
  CANVAS_MIN_Y: 0,
  CANVAS_MAX_Y: 5000,
};

interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if adding N shapes would exceed canvas limit
 */
export async function checkShapeLimit(
  canvasId: string,
  additionalShapes: number
): Promise<SafetyCheckResult> {
  const db = admin.database();
  const shapesRef = db.ref(`canvases/${canvasId}/shapes`);
  const snapshot = await shapesRef.once('value');
  const currentShapes = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
  
  const totalShapes = currentShapes + additionalShapes;
  
  if (totalShapes > LIMITS.MAX_SHAPES_ON_CANVAS) {
    return {
      allowed: false,
      reason: `Canvas would exceed maximum of ${LIMITS.MAX_SHAPES_ON_CANVAS} shapes (currently ${currentShapes}, attempting to add ${additionalShapes})`,
    };
  }
  
  return { allowed: true };
}

/**
 * Check if operation would create too many shapes at once
 */
export function checkBulkShapeLimit(count: number): SafetyCheckResult {
  if (count > LIMITS.MAX_SHAPES_PER_COMMAND) {
    return {
      allowed: false,
      reason: `Cannot create more than ${LIMITS.MAX_SHAPES_PER_COMMAND} shapes in a single command (attempted ${count})`,
    };
  }
  
  return { allowed: true };
}

/**
 * Check if tile operation is within limits
 */
export function checkTileOperationLimit(tileCount: number): SafetyCheckResult {
  if (tileCount > LIMITS.MAX_TILES_PER_COMMAND) {
    return {
      allowed: false,
      reason: `Cannot modify more than ${LIMITS.MAX_TILES_PER_COMMAND} tiles in a single command (attempted ${tileCount})`,
    };
  }
  
  return { allowed: true };
}

/**
 * Check if tilemap dimensions are within limits
 */
export function checkTilemapDimensions(width: number, height: number): SafetyCheckResult {
  if (width > LIMITS.MAX_TILEMAP_WIDTH) {
    return {
      allowed: false,
      reason: `Tilemap width cannot exceed ${LIMITS.MAX_TILEMAP_WIDTH} tiles (attempted ${width})`,
    };
  }
  
  if (height > LIMITS.MAX_TILEMAP_HEIGHT) {
    return {
      allowed: false,
      reason: `Tilemap height cannot exceed ${LIMITS.MAX_TILEMAP_HEIGHT} tiles (attempted ${height})`,
    };
  }
  
  const totalTiles = width * height;
  if (totalTiles > LIMITS.MAX_TILES_ON_CANVAS) {
    return {
      allowed: false,
      reason: `Tilemap would exceed maximum of ${LIMITS.MAX_TILES_ON_CANVAS} tiles (${width}x${height} = ${totalTiles})`,
    };
  }
  
  return { allowed: true };
}

/**
 * Clamp value to canvas bounds
 */
export function clampToCanvas(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(LIMITS.CANVAS_MIN_X, Math.min(LIMITS.CANVAS_MAX_X, x)),
    y: Math.max(LIMITS.CANVAS_MIN_Y, Math.min(LIMITS.CANVAS_MAX_Y, y)),
  };
}

/**
 * Check if user can perform operation (basic permission check)
 */
export async function checkUserPermission(
  userId: string,
  canvasId: string
): Promise<SafetyCheckResult> {
  const db = admin.database();
  
  // Check if canvas exists
  const canvasRef = db.ref(`canvases/${canvasId}`);
  const snapshot = await canvasRef.once('value');
  
  if (!snapshot.exists()) {
    return {
      allowed: false,
      reason: 'Canvas not found',
    };
  }
  
  // For now, allow all authenticated users
  // TODO: Add proper access control when implemented
  return { allowed: true };
}

/**
 * Estimate Firebase write cost for operation
 * Returns estimated number of database writes
 */
export function estimateWriteCost(operation: {
  type: 'create' | 'update' | 'delete' | 'tile';
  count: number;
}): number {
  switch (operation.type) {
    case 'create':
      // Each shape creation = 1 write to shapes + 1 to layerOrder
      return operation.count * 2;
    
    case 'update':
      // Each shape update = 1 write
      return operation.count;
    
    case 'delete':
      // Each shape deletion = 1 write to shapes + 1 to layerOrder
      return operation.count * 2;
    
    case 'tile':
      // Batch tile operations use 1 write per batch (up to 100 tiles)
      return Math.ceil(operation.count / 100);
    
    default:
      return operation.count;
  }
}

