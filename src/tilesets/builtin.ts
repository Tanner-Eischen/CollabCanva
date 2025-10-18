import type { Tileset3x3, TileVariantIndex, TerrainVariants } from '../types/tileset'
import { BUILTIN_TERRAIN_ASSETS, type TerrainKey } from './builtinAssets'

const TILE_VARIANT_INDICES: TileVariantIndex[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const TERRAIN_DISPLAY_NAMES: Record<TerrainKey, string> = {
  grass: 'Grass',
  dirt: 'Dirt',
  water: 'Water',
  stone: 'Stone',
}

const TERRAIN_COLORS: Record<TerrainKey, string> = {
  grass: '#4ade80',
  dirt: '#b45309',
  water: '#38bdf8',
  stone: '#94a3b8',
}

function buildTerrainVariants(terrain: TerrainKey): TerrainVariants {
  const variants: Partial<TerrainVariants> = {}

  for (const variant of TILE_VARIANT_INDICES) {
    variants[variant] = BUILTIN_TERRAIN_ASSETS[terrain][variant]
  }

  return variants as TerrainVariants
}

export const BUILTIN_TILESET: Tileset3x3 = {
  id: 'builtin-default',
  name: 'Default Terrain',
  description: 'Built-in placeholder terrain set for prototyping.',
  tileSize: 32,
  terrains: (['grass', 'dirt', 'water', 'stone'] as TerrainKey[]).map((terrainId) => ({
    id: terrainId,
    name: TERRAIN_DISPLAY_NAMES[terrainId],
    variants: buildTerrainVariants(terrainId),
  })),
  palette: (['grass', 'dirt', 'water', 'stone'] as TerrainKey[]).map((terrainId) => ({
    type: terrainId,
    color: TERRAIN_COLORS[terrainId],
    name: TERRAIN_DISPLAY_NAMES[terrainId],
  })),
  metadata: {
    version: 1,
    source: 'builtin',
  },
}

const BUILTIN_TILESETS: Tileset3x3[] = [BUILTIN_TILESET]

export function getBuiltinTileset(id: string): Tileset3x3 | undefined {
  return BUILTIN_TILESETS.find((tileset) => tileset.id === id)
}

export function listBuiltinTilesets(): Tileset3x3[] {
  return [...BUILTIN_TILESETS]
}
