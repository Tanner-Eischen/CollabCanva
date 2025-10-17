/**
 * Tilemap Type Definitions
 * Core types for the tilemap editor feature
 */

import type { TileLayerMeta } from './tileLayer'

// ============================================================================
// Core Tile Data
// ============================================================================

/**
 * Represents a single tile in the tilemap
 */
export interface TileData {
  type: string;           // 'solid', 'platform', 'spawn', 'empty', etc.
  color: string;          // hex color (e.g., '#4ade80')
  variant?: number;       // Auto-tile variant (0-15 bitmask result) - optional for backwards compatibility
  metadata?: Record<string, any>;  // For game logic (collision, etc.)
  animationId?: string;   // Optional animation ID for animated tiles (water, torches, etc.)
}

/**
 * Palette color configuration
 */
export interface PaletteColor {
  type: string;
  color: string;
  name: string;
}

/**
 * Tilemap metadata configuration
 */
export interface TilemapMeta {
  tileSize: number;       // 8, 16, or 32
  width: number;          // Max tiles in X (default: 256)
  height: number;         // Max tiles in Y (default: 256)
  chunkSize: number;      // Tiles per chunk (16)
  palette: PaletteColor[]; // Array of {type, color, name}
  version: number;        // For future migrations
  layers?: TileLayerMeta[]; // Multi-layer support (v2+)
}

// ============================================================================
// Coordinate Types
// ============================================================================

/**
 * Tile coordinate (x, y position in tile grid)
 */
export interface TileCoordinate {
  x: number;
  y: number;
}

/**
 * Chunk coordinate with local tile position
 */
export interface ChunkCoordinate {
  cx: number;  // Chunk X
  cy: number;  // Chunk Y
  lx: number;  // Local X within chunk
  ly: number;  // Local Y within chunk
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Tilemap editing mode
 */
export type TileMode = 'stamp' | 'erase' | 'fill' | 'pick';

/**
 * Connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// ============================================================================
// Firebase Data Types
// ============================================================================

/**
 * Tile data as stored in Firebase (compressed)
 */
export interface FirebaseTileData {
  t: string;   // type
  c: string;   // color
  v?: number;  // variant (0-15 bitmask result) - optional for backwards compatibility
  a?: string;  // animationId - optional for animated tiles
  by: string;  // last editor (user ID)
  ts: number;  // server timestamp
}

/**
 * Firebase tilemap structure
 */
export interface FirebaseTilemapMeta {
  tileSize: number;
  width: number;
  height: number;
  chunkSize: number;
  palette: PaletteColor[];
  version: number;
  layers?: TileLayerMeta[]; // Multi-layer support (v2+)
}

// ============================================================================
// Export/Import Types
// ============================================================================

/**
 * Exported tilemap JSON structure
 */
export interface ExportedTilemap {
  version: number;
  meta: TilemapMeta;
  format: 'sparse' | 'dense';
  tiles: Record<string, TileData> | TileData[][];
  exported_at: string;
  exported_by: string;
  tile_count: number;
}

// ============================================================================
// Coordinate Helper Functions
// ============================================================================

/**
 * Convert tile coordinates to string key
 * @example coordToKey(5, 12) → "5_12"
 */
export function coordToKey(x: number, y: number): string {
  return `${x}_${y}`;
}

/**
 * Parse string key to coordinates
 * @example keyToCoord("5_12") → { x: 5, y: 12 }
 */
export function keyToCoord(key: string): TileCoordinate {
  const [x, y] = key.split('_').map(Number);
  return { x, y };
}

/**
 * Convert chunk coordinates to string key
 * @example chunkToKey(2, 3) → "2_3"
 */
export function chunkToKey(cx: number, cy: number): string {
  return `${cx}_${cy}`;
}

/**
 * Parse chunk key to coordinates
 * @example keyToChunkCoord("2_3") → { cx: 2, cy: 3 }
 */
export function keyToChunkCoord(key: string): { cx: number; cy: number } {
  const [cx, cy] = key.split('_').map(Number);
  return { cx, cy };
}

/**
 * Convert tile coordinates to chunk coordinates
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param chunkSize Tiles per chunk (typically 16)
 * @returns Chunk coordinate with local position
 * @example coordToChunk(20, 35, 16) → { cx: 1, cy: 2, lx: 4, ly: 3 }
 */
export function coordToChunk(x: number, y: number, chunkSize: number): ChunkCoordinate {
  const cx = Math.floor(x / chunkSize);
  const cy = Math.floor(y / chunkSize);
  const lx = x % chunkSize;
  const ly = y % chunkSize;
  
  return { cx, cy, lx, ly };
}

/**
 * Convert chunk coordinates back to tile coordinates
 * @param cx Chunk X
 * @param cy Chunk Y
 * @param lx Local X within chunk
 * @param ly Local Y within chunk
 * @param chunkSize Tiles per chunk
 * @returns Tile coordinate
 * @example chunkToCoord(1, 2, 4, 3, 16) → { x: 20, y: 35 }
 */
export function chunkToCoord(
  cx: number,
  cy: number,
  lx: number,
  ly: number,
  chunkSize: number
): TileCoordinate {
  return {
    x: cx * chunkSize + lx,
    y: cy * chunkSize + ly,
  };
}

/**
 * Get all chunk keys that intersect with a viewport
 * @param viewportX Viewport X position
 * @param viewportY Viewport Y position
 * @param viewportWidth Viewport width
 * @param viewportHeight Viewport height
 * @param tileSize Size of each tile in pixels
 * @param chunkSize Tiles per chunk
 * @returns Array of chunk keys
 */
export function getVisibleChunks(
  viewportX: number,
  viewportY: number,
  viewportWidth: number,
  viewportHeight: number,
  tileSize: number,
  chunkSize: number
): string[] {
  // Convert viewport to tile coordinates
  const startTileX = Math.floor(viewportX / tileSize);
  const startTileY = Math.floor(viewportY / tileSize);
  const endTileX = Math.ceil((viewportX + viewportWidth) / tileSize);
  const endTileY = Math.ceil((viewportY + viewportHeight) / tileSize);
  
  // Convert to chunk coordinates
  const startChunkX = Math.floor(startTileX / chunkSize);
  const startChunkY = Math.floor(startTileY / chunkSize);
  const endChunkX = Math.floor(endTileX / chunkSize);
  const endChunkY = Math.floor(endTileY / chunkSize);
  
  // Generate all chunk keys in range
  const chunks: string[] = [];
  for (let cy = startChunkY; cy <= endChunkY; cy++) {
    for (let cx = startChunkX; cx <= endChunkX; cx++) {
      // Skip negative chunks (out of bounds)
      if (cx >= 0 && cy >= 0) {
        chunks.push(chunkToKey(cx, cy));
      }
    }
  }
  
  return chunks;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if tile coordinates are within bounds
 */
export function isValidTileCoord(x: number, y: number, meta: TilemapMeta): boolean {
  return x >= 0 && y >= 0 && x < meta.width && y < meta.height;
}

/**
 * Clamp tile coordinates to valid bounds
 */
export function clampTileCoord(x: number, y: number, meta: TilemapMeta): TileCoordinate {
  return {
    x: Math.max(0, Math.min(x, meta.width - 1)),
    y: Math.max(0, Math.min(y, meta.height - 1)),
  };
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default tilemap metadata
 */
export const DEFAULT_TILEMAP_META: TilemapMeta = {
  tileSize: 16,
  width: 256,
  height: 256,
  chunkSize: 16,
  palette: [
    { type: 'solid', color: '#4ade80', name: 'Ground' },
    { type: 'platform', color: '#60a5fa', name: 'Platform' },
    { type: 'spawn', color: '#fbbf24', name: 'Spawn' },
    { type: 'empty', color: '#ef4444', name: 'Empty' },
  ],
  version: 2, // Version 2: Multi-layer support
  layers: undefined, // Will be populated with default layers on creation
};

