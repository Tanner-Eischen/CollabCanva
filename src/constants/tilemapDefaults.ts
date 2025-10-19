/**
 * Tilemap Default Configuration
 * Consolidated defaults for tilemap editor (palette, sprites, metadata)
 */

import type { PaletteColor, TilemapMeta } from '../types/tilemap'

/**
 * Default tilemap palette
 * 
 * These are the default tile types available in the palette.
 * The palette is stored in Firebase per canvas and can be customized.
 * 
 * Auto-tiling support is provided by tilesets that implement sprite variants.
 */
export const DEFAULT_TILEMAP_PALETTE: PaletteColor[] = [
  { type: 'grass', color: '#4ade80', name: 'Grass' },
  { type: 'dirt', color: '#92400e', name: 'Dirt' },
  { type: 'stone', color: '#6b7280', name: 'Stone' },
  { type: 'water', color: '#3b82f6', name: 'Water' },
  { type: 'flower', color: '#ec4899', name: 'Flower' },
  { type: 'plain', color: '#ffffff', name: 'Plain' },
]

/**
 * Default tilemap metadata configuration
 * Used when initializing a new tilemap
 */
export const DEFAULT_TILEMAP_META: TilemapMeta = {
  tileSize: 16,
  width: 256,
  height: 256,
  chunkSize: 16,
  palette: DEFAULT_TILEMAP_PALETTE,
  version: 1,
}

