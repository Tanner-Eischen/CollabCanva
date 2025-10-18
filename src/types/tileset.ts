/**
 * Tileset Type Definitions
 * Shared types for 3x3 auto-tiling tilesets and palettes
 */

import type { TileLayerMeta } from './tileLayer'

/**
 * The index of a tile within a 3x3 terrain variant set.
 * Values map left-to-right, top-to-bottom (1-9).
 */
export type TileVariantIndex =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9

/**
 * Mapping of variant index to an image asset path.
 */
export type TerrainVariants = Record<TileVariantIndex, string>

/**
 * Palette color configuration shared between tilemaps and tilesets.
 */
export interface PaletteColor {
  type: string
  color: string
  name: string
}

/**
 * Metadata describing a tilemap configuration that can be associated with a tileset.
 */
export interface TilemapMeta {
  tileSize: number // 8, 16, or 32
  width: number // Max tiles in X (default: 256)
  height: number // Max tiles in Y (default: 256)
  chunkSize: number // Tiles per chunk (16)
  palette: PaletteColor[] // Array of {type, color, name}
  version: number // For future migrations
  layers?: TileLayerMeta[] // Multi-layer support (v2+)
  activeTilesetId?: string // Currently active tileset identifier
}

/**
 * A terrain within a 3x3 tileset.
 */
export interface TilesetTerrain3x3 {
  id: string
  name: string
  description?: string
  variants: TerrainVariants
  tags?: string[]
}

/**
 * Tileset definition for a 3x3 auto-tiling collection.
 */
export interface Tileset3x3 {
  id: string
  name: string
  description?: string
  tileSize: number
  terrains: TilesetTerrain3x3[]
  palette?: PaletteColor[]
  metadata?: Record<string, unknown>
}
