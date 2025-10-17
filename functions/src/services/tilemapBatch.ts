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
 * Uses chunked storage system for better performance
 */
export async function batchSetTiles(
  canvasId: string,
  tiles: TileData[]
): Promise<BatchResult> {
  try {
    const db = admin.database();
    const BATCH_SIZE = 100;
    const CHUNK_SIZE = 16;
    const batches = Math.ceil(tiles.length / BATCH_SIZE);

    // Helper to convert global coords to chunk/local coords
    const coordToChunk = (row: number, col: number) => {
      const chunkX = Math.floor(col / CHUNK_SIZE);
      const chunkY = Math.floor(row / CHUNK_SIZE);
      const localX = col % CHUNK_SIZE;
      const localY = row % CHUNK_SIZE;
      return { chunkX, chunkY, localX, localY };
    };

    // Process tiles in batches
    for (let i = 0; i < batches; i++) {
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min((i + 1) * BATCH_SIZE, tiles.length);
      const batchTiles = tiles.slice(batchStart, batchEnd);

      // Build update object for this batch
      const updates: any = {};
      
      for (const tile of batchTiles) {
        const { chunkX, chunkY, localX, localY } = coordToChunk(tile.row, tile.col);
        const chunkKey = `${chunkX}_${chunkY}`;
        const tileKey = `${localX}_${localY}`;
        const tilePath = `tilemaps/${canvasId}/chunks/${chunkKey}/tiles/${tileKey}`;
        
        // Match frontend's compressed format (t = type, c = color, v = variant)
        updates[tilePath] = {
          t: tile.type,
          c: '#ffffff', // Default color
          v: tile.variant || 0,
          by: 'ai', // Updated by AI
          ts: Date.now(),
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
 * Removes tiles in batches using chunked storage
 */
export async function batchEraseTiles(
  canvasId: string,
  positions: Array<{ row: number; col: number }>
): Promise<BatchResult> {
  try {
    const db = admin.database();
    const BATCH_SIZE = 100;
    const CHUNK_SIZE = 16;
    const batches = Math.ceil(positions.length / BATCH_SIZE);

    // Helper to convert global coords to chunk/local coords
    const coordToChunk = (row: number, col: number) => {
      const chunkX = Math.floor(col / CHUNK_SIZE);
      const chunkY = Math.floor(row / CHUNK_SIZE);
      const localX = col % CHUNK_SIZE;
      const localY = row % CHUNK_SIZE;
      return { chunkX, chunkY, localX, localY };
    };

    // Process positions in batches
    for (let i = 0; i < batches; i++) {
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min((i + 1) * BATCH_SIZE, positions.length);
      const batchPositions = positions.slice(batchStart, batchEnd);

      // Build update object for this batch (set to null to delete)
      const updates: any = {};
      
      for (const pos of batchPositions) {
        const { chunkX, chunkY, localX, localY } = coordToChunk(pos.row, pos.col);
        const chunkKey = `${chunkX}_${chunkY}`;
        const tileKey = `${localX}_${localY}`;
        const tilePath = `tilemaps/${canvasId}/chunks/${chunkKey}/tiles/${tileKey}`;
        updates[tilePath] = null;
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
 * Clear rectangular region (only erases existing tiles)
 * Queries existing tiles first, then erases only those that exist
 * Uses chunked storage path: tilemaps/${canvasId}/chunks
 */
export async function clearRegion(
  canvasId: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Promise<BatchResult> {
  try {
    const db = admin.database();
    const CHUNK_SIZE = 16;
    
    // Query all chunks (chunked storage system)
    const chunksSnapshot = await db.ref(`tilemaps/${canvasId}/chunks`).once('value');
    const chunks = chunksSnapshot.val();
    
    if (!chunks) {
      return {
        success: true,
        tileCount: 0,
        batchCount: 0,
      };
    }

    // Collect tiles within the region from all chunks
    const positions: Array<{ row: number; col: number }> = [];
    
    for (const [chunkKey, chunkData] of Object.entries(chunks)) {
      const chunk = chunkData as any;
      if (!chunk.tiles) continue;
      
      // Parse chunk coordinates from key (format: "cx_cy")
      const [chunkX, chunkY] = chunkKey.split('_').map(Number);
      
      for (const [tileKey, _tileData] of Object.entries(chunk.tiles)) {
        // Parse local tile coordinates from key (format: "lx_ly")
        const [localX, localY] = tileKey.split('_').map(Number);
        
        // Calculate global tile coordinates
        const row = chunkY * CHUNK_SIZE + localY;
        const col = chunkX * CHUNK_SIZE + localX;
        
        if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
          positions.push({ row, col });
        }
      }
    }

    if (positions.length === 0) {
      return {
        success: true,
        tileCount: 0,
        batchCount: 0,
      };
    }

    return batchEraseTiles(canvasId, positions);
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
 * Clear all painted tiles on the tilemap
 * Only erases tiles that actually exist
 * Uses chunked storage path: tilemaps/${canvasId}/chunks
 */
export async function clearAllTiles(
  canvasId: string
): Promise<BatchResult> {
  try {
    const db = admin.database();
    const CHUNK_SIZE = 16;
    
    // Query all chunks (chunked storage system)
    const chunksSnapshot = await db.ref(`tilemaps/${canvasId}/chunks`).once('value');
    const chunks = chunksSnapshot.val();
    
    if (!chunks) {
      return {
        success: true,
        tileCount: 0,
        batchCount: 0,
      };
    }

    // Collect all tile positions from all chunks
    const positions: Array<{ row: number; col: number }> = [];
    
    for (const [chunkKey, chunkData] of Object.entries(chunks)) {
      const chunk = chunkData as any;
      if (!chunk.tiles) continue;
      
      // Parse chunk coordinates from key (format: "cx_cy")
      const [chunkX, chunkY] = chunkKey.split('_').map(Number);
      
      for (const [tileKey, _tileData] of Object.entries(chunk.tiles)) {
        // Parse local tile coordinates from key (format: "lx_ly")
        const [localX, localY] = tileKey.split('_').map(Number);
        
        // Calculate global tile coordinates
        const row = chunkY * CHUNK_SIZE + localY;
        const col = chunkX * CHUNK_SIZE + localX;
        
        positions.push({ row, col });
      }
    }

    if (positions.length === 0) {
      return {
        success: true,
        tileCount: 0,
        batchCount: 0,
      };
    }

    return batchEraseTiles(canvasId, positions);
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

/**
 * Get actual painted tile count in a region (queries Firebase using chunked storage)
 */
export async function getPaintedTileCountInRegion(
  canvasId: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Promise<number> {
  try {
    const db = admin.database();
    const CHUNK_SIZE = 16;
    
    // Query all chunks
    const chunksSnapshot = await db.ref(`tilemaps/${canvasId}/chunks`).once('value');
    const chunks = chunksSnapshot.val();
    
    if (!chunks) {
      return 0;
    }

    let count = 0;
    for (const [chunkKey, chunkData] of Object.entries(chunks)) {
      const chunk = chunkData as any;
      if (!chunk.tiles) continue;
      
      // Parse chunk coordinates
      const [chunkX, chunkY] = chunkKey.split('_').map(Number);
      
      for (const [tileKey, _tileData] of Object.entries(chunk.tiles)) {
        // Parse local tile coordinates
        const [localX, localY] = tileKey.split('_').map(Number);
        
        // Calculate global coordinates
        const row = chunkY * CHUNK_SIZE + localY;
        const col = chunkX * CHUNK_SIZE + localX;
        
        if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
          count++;
        }
      }
    }

    return count;
  } catch (error) {
    return 0;
  }
}

