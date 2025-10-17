/**
 * Tile Generators Service
 * Unified interface for procedural tilemap generation
 * Wraps existing algorithms: Perlin, Cellular Automata, Random Walk, WFC
 * 
 * PR-35: Procedural Generation Tools (PRD 5)
 */

import type { TileData } from '../../types/tilemap'
import {
  generatePerlinTerrain,
  type PerlinNoiseParams,
  DEFAULT_PERLIN_PARAMS,
} from '../../algorithms/perlinNoise'
import {
  generateCellularCave,
  generateCellularDungeon,
  type CellularAutomataParams,
  DEFAULT_CAVE_PARAMS,
  DEFAULT_DUNGEON_PARAMS,
} from '../../algorithms/cellularAutomata'
import {
  generateRandomWalkPath,
  generateRandomWalkRiver,
  type RandomWalkParams,
  DEFAULT_PATH_PARAMS,
  DEFAULT_RIVER_PARAMS,
} from '../../algorithms/randomWalk'
import {
  generateWFCMap,
  type WFCParams,
  createBasicWFCTiles,
} from '../../algorithms/waveFunctionCollapse'

/**
 * Generator type classification
 */
export type GeneratorType = 'perlin' | 'cellular' | 'randomWalk' | 'wfc'

/**
 * Generator mode for specific use cases
 */
export type GeneratorMode =
  | 'terrain'        // Natural terrain (Perlin)
  | 'cave'           // Cave system (Cellular)
  | 'dungeon'        // Dungeon rooms (Cellular)
  | 'path'           // Paths/roads (Random Walk)
  | 'river'          // Rivers/water (Random Walk)
  | 'structured'     // Structured patterns (WFC)

/**
 * Unified generator parameters
 */
export type GeneratorParams =
  | { type: 'perlin'; params: PerlinNoiseParams }
  | { type: 'cellular'; params: CellularAutomataParams; mode: 'cave' | 'dungeon' }
  | { type: 'randomWalk'; params: RandomWalkParams; mode: 'path' | 'river' }
  | { type: 'wfc'; params: WFCParams }

/**
 * Generator metadata and configuration
 */
export interface GeneratorConfig {
  type: GeneratorType
  mode: GeneratorMode
  name: string
  description: string
  icon: string
  defaultParams: any
  previewable: boolean // Can show live preview?
  tags: string[]
}

/**
 * Generation result
 */
export interface GenerationResult {
  tiles: TileData[][]
  width: number
  height: number
  metadata: {
    generator: GeneratorType
    mode: GeneratorMode
    params: any
    seed: number
    generatedAt: number
    tileCount: number
  }
}

/**
 * All available generators
 */
export const GENERATORS: Record<GeneratorMode, GeneratorConfig> = {
  terrain: {
    type: 'perlin',
    mode: 'terrain',
    name: 'Perlin Terrain',
    description: 'Natural-looking terrain with hills, valleys, and biomes',
    icon: '🏔️',
    defaultParams: DEFAULT_PERLIN_PARAMS,
    previewable: true,
    tags: ['natural', 'organic', 'terrain', 'landscape'],
  },
  cave: {
    type: 'cellular',
    mode: 'cave',
    name: 'Cellular Cave',
    description: 'Organic cave system with winding passages',
    icon: '🕳️',
    defaultParams: DEFAULT_CAVE_PARAMS,
    previewable: true,
    tags: ['cave', 'dungeon', 'underground', 'organic'],
  },
  dungeon: {
    type: 'cellular',
    mode: 'dungeon',
    name: 'Dungeon Rooms',
    description: 'Dungeon with interconnected rooms',
    icon: '🏰',
    defaultParams: DEFAULT_DUNGEON_PARAMS,
    previewable: true,
    tags: ['dungeon', 'rooms', 'structured'],
  },
  path: {
    type: 'randomWalk',
    mode: 'path',
    name: 'Random Path',
    description: 'Winding paths and roads',
    icon: '🛣️',
    defaultParams: DEFAULT_PATH_PARAMS,
    previewable: true,
    tags: ['path', 'road', 'trail'],
  },
  river: {
    type: 'randomWalk',
    mode: 'river',
    name: 'River System',
    description: 'Natural river with branches',
    icon: '🌊',
    defaultParams: DEFAULT_RIVER_PARAMS,
    previewable: true,
    tags: ['river', 'water', 'natural'],
  },
  structured: {
    type: 'wfc',
    mode: 'structured',
    name: 'WFC Structured',
    description: 'Constraint-based structured generation',
    icon: '🧩',
    defaultParams: { width: 32, height: 32, tiles: [], seed: Date.now() },
    previewable: false, // Requires tile definitions
    tags: ['structured', 'pattern', 'constraint'],
  },
}

/**
 * Generate tilemap using specified generator
 */
export async function generateTilemap(
  generatorParams: GeneratorParams,
  width: number,
  height: number
): Promise<GenerationResult> {
  const startTime = Date.now()
  let tiles: TileData[][]
  let metadata: GenerationResult['metadata']

  switch (generatorParams.type) {
    case 'perlin': {
      tiles = generatePerlinTerrain(width, height, generatorParams.params)
      metadata = {
        generator: 'perlin',
        mode: 'terrain',
        params: generatorParams.params,
        seed: generatorParams.params.seed || 0,
        generatedAt: startTime,
        tileCount: countTiles(tiles),
      }
      break
    }

    case 'cellular': {
      if (generatorParams.mode === 'cave') {
        tiles = generateCellularCave(width, height, generatorParams.params)
      } else {
        tiles = generateCellularDungeon(width, height, generatorParams.params)
      }
      metadata = {
        generator: 'cellular',
        mode: generatorParams.mode,
        params: generatorParams.params,
        seed: generatorParams.params.seed || 0,
        generatedAt: startTime,
        tileCount: countTiles(tiles),
      }
      break
    }

    case 'randomWalk': {
      if (generatorParams.mode === 'river') {
        tiles = generateRandomWalkRiver(width, height, generatorParams.params)
      } else {
        tiles = generateRandomWalkPath(width, height, generatorParams.params)
      }
      metadata = {
        generator: 'randomWalk',
        mode: generatorParams.mode,
        params: generatorParams.params,
        seed: generatorParams.params.seed || 0,
        generatedAt: startTime,
        tileCount: countTiles(tiles),
      }
      break
    }

    case 'wfc': {
      // WFC requires tile definitions
      const wfcTiles = generatorParams.params.tiles.length > 0
        ? generatorParams.params.tiles
        : createBasicWFCTiles()
      
      const wfcParams = { ...generatorParams.params, tiles: wfcTiles }
      tiles = generateWFCMap(wfcParams)
      
      metadata = {
        generator: 'wfc',
        mode: 'structured',
        params: wfcParams,
        seed: wfcParams.seed || 0,
        generatedAt: startTime,
        tileCount: countTiles(tiles),
      }
      break
    }

    default:
      throw new Error(`Unknown generator type: ${(generatorParams as any).type}`)
  }

  return {
    tiles,
    width,
    height,
    metadata,
  }
}

/**
 * Get generator config by mode
 */
export function getGeneratorConfig(mode: GeneratorMode): GeneratorConfig {
  return GENERATORS[mode]
}

/**
 * Get all generator configs
 */
export function getAllGenerators(): GeneratorConfig[] {
  return Object.values(GENERATORS)
}

/**
 * Get generators by tag
 */
export function getGeneratorsByTag(tag: string): GeneratorConfig[] {
  return Object.values(GENERATORS).filter((gen) => gen.tags.includes(tag))
}

/**
 * Recommend generator based on AI prompt
 * This is called by AI to choose the best generator
 */
export function recommendGenerator(prompt: string): GeneratorMode {
  const lowerPrompt = prompt.toLowerCase()

  // Cave keywords
  if (
    lowerPrompt.includes('cave') ||
    lowerPrompt.includes('underground') ||
    lowerPrompt.includes('cavern')
  ) {
    return 'cave'
  }

  // Dungeon keywords
  if (
    lowerPrompt.includes('dungeon') ||
    lowerPrompt.includes('room') ||
    lowerPrompt.includes('corridor')
  ) {
    return 'dungeon'
  }

  // River keywords
  if (
    lowerPrompt.includes('river') ||
    lowerPrompt.includes('water') ||
    lowerPrompt.includes('stream') ||
    lowerPrompt.includes('lake')
  ) {
    return 'river'
  }

  // Path keywords
  if (
    lowerPrompt.includes('path') ||
    lowerPrompt.includes('road') ||
    lowerPrompt.includes('trail') ||
    lowerPrompt.includes('walkway')
  ) {
    return 'path'
  }

  // Terrain keywords (default)
  if (
    lowerPrompt.includes('terrain') ||
    lowerPrompt.includes('landscape') ||
    lowerPrompt.includes('world') ||
    lowerPrompt.includes('biome') ||
    lowerPrompt.includes('natural')
  ) {
    return 'terrain'
  }

  // Default to terrain for general requests
  return 'terrain'
}

/**
 * Count non-null tiles in 2D array
 */
function countTiles(tiles: TileData[][]): number {
  let count = 0
  for (const row of tiles) {
    for (const tile of row) {
      if (tile) count++
    }
  }
  return count
}

/**
 * Convert 2D tile array to sparse map
 */
export function tilesToSparseMap(tiles: TileData[][]): Map<string, TileData> {
  const map = new Map<string, TileData>()
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const tile = tiles[y][x]
      if (tile) {
        map.set(`${x}_${y}`, tile)
      }
    }
  }
  
  return map
}

/**
 * Generate preview (smaller, faster)
 */
export async function generatePreview(
  generatorParams: GeneratorParams,
  previewSize: { width: number; height: number } = { width: 32, height: 32 }
): Promise<GenerationResult> {
  return generateTilemap(generatorParams, previewSize.width, previewSize.height)
}

