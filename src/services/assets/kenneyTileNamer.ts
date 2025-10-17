/**
 * Kenney Tile Namer
 * 
 * Provides standard naming conventions for Kenney.nl tileset assets.
 * Supports blob16, blob47, and common prop patterns.
 */

/**
 * Blob-16 auto-tile system (most common Kenney format)
 * Based on 4-neighbor connectivity (NESW)
 */
export const KENNEY_AUTOTILE_16: Record<number, string> = {
  0: 'isolated',
  1: 'n',
  2: 'e',
  3: 'ne',
  4: 's',
  5: 'ns',
  6: 'es',
  7: 'nes',
  8: 'w',
  9: 'nw',
  10: 'ew',
  11: 'new',
  12: 'sw',
  13: 'nsw',
  14: 'esw',
  15: 'nesw',
}

/**
 * Blob-47 auto-tile system (extended Kenney format)
 * Includes inner/outer corners
 */
export const KENNEY_AUTOTILE_47: Record<number, string> = {
  // Center tiles
  0: 'center',
  
  // Edge tiles
  1: 'edge_n',
  2: 'edge_e',
  3: 'edge_s',
  4: 'edge_w',
  
  // Outer corners
  5: 'corner_outer_ne',
  6: 'corner_outer_se',
  7: 'corner_outer_sw',
  8: 'corner_outer_nw',
  
  // Inner corners
  9: 'corner_inner_ne',
  10: 'corner_inner_se',
  11: 'corner_inner_sw',
  12: 'corner_inner_nw',
  
  // T-junctions
  13: 'tjunc_n',
  14: 'tjunc_e',
  15: 'tjunc_s',
  16: 'tjunc_w',
  
  // Cross
  17: 'cross',
  
  // Extended variations (if present)
  ...Array.from({ length: 30 }, (_, i) => i + 18).reduce((acc, i) => {
    acc[i] = `variant_${i - 17}`
    return acc
  }, {} as Record<number, string>)
}

/**
 * Common Kenney prop patterns
 */
export const KENNEY_PROP_PATTERNS: Array<{
  namePattern: RegExp
  category: string
  variants?: string[]
}> = [
  {
    namePattern: /tree/i,
    category: 'tree',
    variants: ['small', 'medium', 'large', 'dead', 'pine', 'oak']
  },
  {
    namePattern: /rock/i,
    category: 'rock',
    variants: ['small', 'medium', 'large', 'boulder']
  },
  {
    namePattern: /flower/i,
    category: 'flower',
    variants: ['red', 'yellow', 'blue', 'pink']
  },
  {
    namePattern: /grass/i,
    category: 'grass',
    variants: ['tuft', 'patch', 'tall']
  },
  {
    namePattern: /bush/i,
    category: 'bush',
    variants: ['small', 'large', 'berry']
  },
  {
    namePattern: /fence/i,
    category: 'fence',
    variants: ['straight', 'corner', 'post']
  },
  {
    namePattern: /wall/i,
    category: 'wall',
    variants: ['straight', 'corner', 'door', 'window']
  },
  {
    namePattern: /door/i,
    category: 'door',
    variants: ['closed', 'open', 'left', 'right']
  },
  {
    namePattern: /chest/i,
    category: 'chest',
    variants: ['closed', 'open', 'gold', 'silver']
  },
  {
    namePattern: /coin/i,
    category: 'coin',
    variants: ['gold', 'silver', 'bronze']
  }
]

/**
 * Material keywords for Kenney tilesets
 * Expanded list to catch more variations
 */
export const KENNEY_MATERIALS: Record<string, string[]> = {
  grass: ['grass', 'lawn', 'green', 'turf', 'vegetation', 'nature'],
  dirt: ['dirt', 'earth', 'soil', 'brown', 'mud', 'ground'],
  stone: ['stone', 'rock', 'gray', 'grey', 'cobble', 'granite'],
  water: ['water', 'ocean', 'sea', 'blue', 'aqua', 'liquid'],
  sand: ['sand', 'beach', 'desert', 'yellow', 'dune'],
  snow: ['snow', 'ice', 'frozen', 'white', 'winter', 'arctic'],
  wood: ['wood', 'plank', 'timber', 'log', 'tree', 'oak'],
  brick: ['brick', 'castle', 'dungeon', 'wall'],
  metal: ['metal', 'iron', 'steel', 'silver'],
  crystal: ['crystal', 'gem', 'magic', 'purple'],
  lava: ['lava', 'magma', 'fire', 'red', 'volcano'],
  // Generic fallback
  tile: ['tile', 'tileset', 'tiles', 'sheet', 'terrain', 'map', 'level']
}

/**
 * Theme keywords for Kenney tilesets
 */
export const KENNEY_THEMES: Record<string, string[]> = {
  forest: ['forest', 'nature', 'jungle', 'woods'],
  dungeon: ['dungeon', 'cave', 'underground', 'castle'],
  desert: ['desert', 'sand', 'dunes', 'oasis'],
  snow: ['snow', 'ice', 'winter', 'arctic', 'tundra'],
  swamp: ['swamp', 'marsh', 'bog', 'wetland'],
  lava: ['lava', 'volcano', 'magma', 'fire'],
  sci_fi: ['scifi', 'space', 'alien', 'tech'],
  medieval: ['medieval', 'fantasy', 'rpg', 'knight'],
  urban: ['city', 'urban', 'town', 'street'],
  platform: ['platform', 'game', 'level']
}

/**
 * Detect if a tileset follows Kenney or similar naming conventions
 * This includes Kenney.nl assets and other well-known tileset collections
 */
export function detectKenneyTileset(assetName: string): boolean {
  const kenneyIndicators = [
    /kenney/i,
    /0x72/i,  // 0x72 dungeon tilesets
    /\btile(set)?_?\d+/i, // tile_001, tileset123
    /(top.?down|platform|rpg).?pack/i,
    /nature.?pack/i,
    /dungeon.?pack/i,
    /_topdown_/i,  // Common pattern in Kenney files
    /_platformer_/i  // Common pattern in Kenney files
  ]
  
  return kenneyIndicators.some(pattern => pattern.test(assetName))
}

/**
 * Generate named tiles for a Kenney tileset
 */
export function generateKenneyNamedTiles(
  assetName: string,
  tileCount: number,
  detectedMaterial?: string
): Record<string, number> {
  const namedTiles: Record<string, number> = {}
  // Use provided material, or detect from name, or fallback to 'tile'
  const baseMaterial = detectedMaterial || detectMaterialFromName(assetName)
  
  // Detect auto-tile system based on tile count
  if (tileCount === 16) {
    // Blob-16 system
    Object.entries(KENNEY_AUTOTILE_16).forEach(([index, suffix]) => {
      namedTiles[`${baseMaterial}.${suffix}`] = parseInt(index)
    })
  } else if (tileCount === 47 || tileCount === 48) {
    // Blob-47 system
    Object.entries(KENNEY_AUTOTILE_47).forEach(([index, suffix]) => {
      if (parseInt(index) < tileCount) {
        namedTiles[`${baseMaterial}.${suffix}`] = parseInt(index)
      }
    })
  } else {
    // Large tileset - use generic numbering with material prefix
    // Format: { "grass_0": 0, "grass_1": 1, ... }
    console.log(`🎮 [KENNEY] Large tileset (${tileCount} tiles) - using indexed naming with material: ${baseMaterial}`)
    for (let i = 0; i < tileCount; i++) {
      // Use format: semantic name → tile index
      namedTiles[`${baseMaterial}_${i}`] = i
    }
    console.log(`🎮 [KENNEY] Created ${tileCount} named tiles (sample: ${Object.keys(namedTiles).slice(0, 5).join(', ')})`)
  }
  
  return namedTiles
}

/**
 * Detect material from asset name
 * Returns 'tile' as fallback if no specific material detected
 */
export function detectMaterialFromName(assetName: string): string {
  const nameLower = assetName.toLowerCase()
  
  // Check for specific materials first (skip 'tile' which is the fallback)
  for (const [material, keywords] of Object.entries(KENNEY_MATERIALS)) {
    if (material !== 'tile' && keywords.some(keyword => nameLower.includes(keyword))) {
      console.log(`🎮 [KENNEY] Detected material: ${material} from name: ${assetName}`)
      return material
    }
  }
  
  // Fallback to generic 'tile'
  console.log(`🎮 [KENNEY] No specific material detected, using fallback: tile`)
  return 'tile'
}

/**
 * Detect theme from asset name
 */
export function detectThemeFromName(assetName: string): string[] {
  const nameLower = assetName.toLowerCase()
  const detectedThemes: string[] = []
  
  for (const [theme, keywords] of Object.entries(KENNEY_THEMES)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      detectedThemes.push(theme)
    }
  }
  
  return detectedThemes
}

/**
 * Suggest layer types based on asset name and tile count
 */
export function suggestLayerTypes(assetName: string, tileCount: number): string[] {
  const nameLower = assetName.toLowerCase()
  const layerTypes: string[] = []
  
  // Auto-tile systems are usually ground or background
  if (tileCount === 16 || tileCount === 47 || tileCount === 48) {
    layerTypes.push('ground', 'background')
  }
  
  // Props and decorations
  if (nameLower.includes('prop') || nameLower.includes('object')) {
    layerTypes.push('props', 'decals')
  }
  
  // FX
  if (nameLower.includes('effect') || nameLower.includes('particle')) {
    layerTypes.push('fx')
  }
  
  // Collision
  if (nameLower.includes('collision') || nameLower.includes('physics')) {
    layerTypes.push('collision')
  }
  
  // Default to ground if nothing specific detected
  if (layerTypes.length === 0) {
    layerTypes.push('ground')
  }
  
  return layerTypes
}

/**
 * Generate comprehensive Kenney metadata
 */
export function generateKenneyMetadata(
  assetName: string,
  tileCount: number,
  tileWidth: number,
  tileHeight: number
): {
  themes: string[]
  materials: string[]
  layerTypes: string[]
  namedTiles: Record<string, number>
  autoTileSystem?: 'blob16' | 'blob47'
  features: {
    autotile?: boolean
    props?: boolean
  }
} {
  console.log(`🎮 [KENNEY] Generating metadata for: ${assetName} (${tileCount} tiles @ ${tileWidth}x${tileHeight})`)
  
  const detectedMaterial = detectMaterialFromName(assetName)
  const themes = detectThemeFromName(assetName)
  const materials = [detectedMaterial] // Always return material, even if it's 'tile'
  const layerTypes = suggestLayerTypes(assetName, tileCount)
  const namedTiles = generateKenneyNamedTiles(assetName, tileCount, detectedMaterial)
  
  console.log(`🎮 [KENNEY] Metadata: themes=[${themes.join(',')}], materials=[${materials.join(',')}], tiles=${Object.keys(namedTiles).length}`)
  
  let autoTileSystem: 'blob16' | 'blob47' | undefined
  let features: { autotile?: boolean; props?: boolean } = {}
  
  if (tileCount === 16) {
    autoTileSystem = 'blob16'
    features.autotile = true
  } else if (tileCount === 47 || tileCount === 48) {
    autoTileSystem = 'blob47'
    features.autotile = true
  }
  
  if (assetName.toLowerCase().includes('prop') || assetName.toLowerCase().includes('object')) {
    features.props = true
  }
  
  return {
    themes,
    materials,
    layerTypes: layerTypes as Array<'background' | 'ground' | 'props' | 'fx' | 'decals' | 'collision'>,
    namedTiles,
    autoTileSystem,
    features
  }
}

/**
 * Common sprite type patterns
 */
export const SPRITE_TYPE_PATTERNS: Record<string, string[]> = {
  enemy: ['enemy', 'enemies', 'monster', 'monsters', 'mob', 'mobs', 'creature', 'creatures', 'npc', 'npcs'],
  weapon: ['weapon', 'weapons', 'sword', 'gun', 'bow', 'arrow', 'axe', 'spear', 'staff', 'wand'],
  item: ['item', 'items', 'loot', 'drop', 'collectible', 'collectibles', 'pickup', 'pickups'],
  character: ['character', 'characters', 'player', 'hero', 'protagonist', 'person', 'people'],
  prop: ['prop', 'props', 'object', 'objects', 'furniture', 'tree', 'tree', 'rock', 'plant', 'decoration'],
  effect: ['effect', 'effects', 'particle', 'particles', 'spell', 'magic', 'fx'],
  ui: ['ui', 'button', 'buttons', 'icon', 'icons', 'menu', 'hud', 'interface'],
  tileset: ['tile', 'tileset', 'ground', 'terrain', 'wall', 'floor', 'grass', 'stone', 'water'],
}

/**
 * Detect sprite type from filename
 */
export function detectSpriteType(assetName: string): string | undefined {
  const nameLower = assetName.toLowerCase()
  
  for (const [type, keywords] of Object.entries(SPRITE_TYPE_PATTERNS)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      console.log(`🎮 [SPRITE TYPE] Detected type: ${type} from name: ${assetName}`)
      return type
    }
  }
  
  return undefined
}

/**
 * Generate named tiles with type prefix
 */
export function generateNamedTilesWithType(
  tileCount: number,
  baseMaterial: string,
  spriteType?: string
): Record<string, number> {
  const namedTiles: Record<string, number> = {}
  
  if (spriteType) {
    // Use type as prefix
    for (let i = 0; i < tileCount; i++) {
      namedTiles[`${spriteType}_${i}`] = i
    }
    console.log(`🎮 [SPRITE TYPE] Created ${tileCount} named tiles with type: ${spriteType}`)
  } else {
    // Fallback to material
    for (let i = 0; i < tileCount; i++) {
      namedTiles[`${baseMaterial}_${i}`] = i
    }
    console.log(`🎮 [SPRITE TYPE] Created ${tileCount} named tiles with material: ${baseMaterial}`)
  }
  
  return namedTiles
}

