/**
 * Tilemap Default Configuration
 * Consolidated defaults for tilemap editor (palette, sprites, metadata)
 */

import type { PaletteColor, TilemapMeta } from '../types/tilemap'
import type { TilesetAsset } from './tilesetAssets'

/**
 * Auto-tile sprite set configuration
 * This is the same interface as TilesetAsset but defined here for convenience
 */
export interface AutoTileSet {
  basePath: string          // Base path to tile directory (e.g., '/assets/tiles/water')
  tileSize: number          // Size of each tile (16x16)
  variants: number[]        // Maps position (0-8) to sprite index for 3×3 grid
}

/**
 * Get path to individual tile file
 * For 3×3 grid: variants 1-9 (not 0-indexed)
 */
export function getTilePath(tileType: string, variant: number): string {
  const sprite = TILESET_SPRITES[tileType]
  if (!sprite) return ''
  
  // Clamp variant to valid range (0-8)
  const clampedVariant = Math.max(0, Math.min(8, variant))
  
  // Variants are 1-9 for 3×3 grid
  const variantNumber = clampedVariant + 1 // Convert 0-based to 1-based
  const path = `${sprite.basePath}/${tileType}_${variantNumber.toString().padStart(2, '0')}.png`
  
  return path
}

/**
 * Default tilemap palette
 * 
 * These are the default tile types available in the palette.
 * The palette is stored in Firebase per canvas and can be customized.
 * 
 * Note: First 5 types (grass, dirt, stone, water, flower) have sprite assets
 * available via TILESET_SPRITES map below.
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
 * Tileset sprite metadata (client-only, NOT stored in Firebase)
 * 
 * Maps tile type to sprite asset configuration for auto-tiling.
 * Only tiles with entries here will render as sprites; others render
 * as colored rectangles (backwards compatible).
 * 
 * 3×3 Grid Auto-tiling System:
 * - 9 variants per tileset (files numbered 01-09)
 * - Layout: [TL, TC, TR, ML, MC, MR, BL, BC, BR]
 * 
 * License: Kenney Micro Roguelike assets (CC0 Public Domain)
 * Source: https://kenney.nl/assets/micro-roguelike
 */
export const TILESET_SPRITES: Record<string, AutoTileSet> = {
  grass: {
    basePath: '/assets/tiles/grass',
    tileSize: 16,
    variants: [0, 1, 2, 3, 4, 5, 6, 7, 8], // 3×3 grid (9 variants)
  },
  
  dirt: {
    basePath: '/assets/tiles/dirt',
    tileSize: 16,
    variants: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  
  stone: {
    basePath: '/assets/tiles/stone',
    tileSize: 16,
    variants: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  
  water: {
    basePath: '/assets/tiles/water',
    tileSize: 16,
    variants: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  
  flower: {
    basePath: '/assets/tiles/flower',
    tileSize: 16,
    variants: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
}

/**
 * Check if a tile type has sprite assets available
 */
export function hasSpriteAsset(tileType: string): boolean {
  return tileType in TILESET_SPRITES
}

/**
 * Get sprite asset for a tile type
 */
export function getSpriteAsset(tileType: string): AutoTileSet | undefined {
  return TILESET_SPRITES[tileType]
}

/**
 * Get sprite variant index for a given variant (0-8 for 3×3 grid)
 * Note: This returns the variant as-is since variants are 0-indexed internally
 */
export function getSpriteVariant(tileType: string, variant: number): number {
  const sprite = TILESET_SPRITES[tileType]
  if (!sprite) return 0
  
  // Clamp variant to valid range (0-8 for 3×3 grid)
  return Math.max(0, Math.min(8, variant))
}

/**
 * Get all tile types that have sprite assets
 */
export function getSpriteTileTypes(): string[] {
  return Object.keys(TILESET_SPRITES)
}

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

