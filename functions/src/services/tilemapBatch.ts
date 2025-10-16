/**
 * Tilemap Batch Operations
 * Efficient batch updates for tilemap tiles
 * PR-30: Task 4.1
 */

import * as admin from 'firebase-admin';

export interface TileData {
  row: number;
  col: number;
  type: string;
  variant?: number;
}

export interface BatchResult {
  success: boolean;
  tileCount: number;
  batchCount: number;
  error?: string;
}

/**
 * Batch set tiles
 * Groups tiles into batches of 100 for efficient Firebase updates
 */
export async function batchSetTiles(
  canvasId: string,
  tiles: TileData[]
): Promise<BatchResult> {
  try {
    const db = admin.database();
    const BATCH_SIZE = 100;
    const batches = Math.ceil(tiles.length / BATCH_SIZE);

    // Process tiles in batches
    for (let i = 0; i < batches; i++) {
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min((i + 1) * BATCH_SIZE, tiles.length);
      const batchTiles = tiles.slice(batchStart, batchEnd);

      // Build update object for this batch
      const updates: any = {};
      
      for (const tile of batchTiles) {
        const tileKey = `${tile.row},${tile.col}`;
        updates[`canvases/${canvasId}/tilemap/tiles/${tileKey}`] = {
          type: tile.type,
          variant: tile.variant || 0,
          row: tile.row,
          col: tile.col,
          updatedAt: Date.now(),
        };
      }

      // Apply batch update
      await db.ref().update(updates);
    }

    return {
      success: true,
      tileCount: tiles.length,
      batchCount: batches,
    };

  } catch (error: any) {
    return {
      success: false,
      tileCount: 0,
      batchCount: 0,
      error: error.message,
    };
  }
}

/**
 * Batch erase tiles
 * Removes tiles in batches
 */
export async function batchEraseTiles(
  canvasId: string,
  positions: Array<{ row: number; col: number }>
): Promise<BatchResult> {
  try {
    const db = admin.database();
    const BATCH_SIZE = 100;
    const batches = Math.ceil(positions.length / BATCH_SIZE);

    // Process positions in batches
    for (let i = 0; i < batches; i++) {
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min((i + 1) * BATCH_SIZE, positions.length);
      const batchPositions = positions.slice(batchStart, batchEnd);

      // Build update object for this batch (set to null to delete)
      const updates: any = {};
      
      for (const pos of batchPositions) {
        const tileKey = `${pos.row},${pos.col}`;
        updates[`canvases/${canvasId}/tilemap/tiles/${tileKey}`] = null;
      }

      // Apply batch update
      await db.ref().update(updates);
    }

    return {
      success: true,
      tileCount: positions.length,
      batchCount: batches,
    };

  } catch (error: any) {
    return {
      success: false,
      tileCount: 0,
      batchCount: 0,
      error: error.message,
    };
  }
}

/**
 * Fill rectangular region with tiles
 * Optimized for filling large areas
 */
export async function fillRegion(
  canvasId: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  tileType: string
): Promise<BatchResult> {
  const tiles: TileData[] = [];

  // Generate all tiles in the region
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      tiles.push({
        row,
        col,
        type: tileType,
        variant: Math.floor(Math.random() * 9), // Random variant 0-8
      });
    }
  }

  return batchSetTiles(canvasId, tiles);
}

/**
 * Clear rectangular region
 * Optimized for clearing large areas
 */
export async function clearRegion(
  canvasId: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Promise<BatchResult> {
  const positions: Array<{ row: number; col: number }> = [];

  // Generate all positions in the region
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      positions.push({ row, col });
    }
  }

  return batchEraseTiles(canvasId, positions);
}

/**
 * Get tile count in a region (for safety checks)
 */
export function getTileCountInRegion(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): number {
  const width = Math.abs(endCol - startCol) + 1;
  const height = Math.abs(endRow - startRow) + 1;
  return width * height;
}

