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
 */
export const KENNEY_MATERIALS: Record<string, string[]> = {
  grass: ['grass', 'lawn', 'green'],
  dirt: ['dirt', 'earth', 'soil', 'brown'],
  stone: ['stone', 'rock', 'gray', 'grey'],
  water: ['water', 'ocean', 'sea', 'blue'],
  sand: ['sand', 'beach', 'desert', 'yellow'],
  snow: ['snow', 'ice', 'frozen', 'white'],
  wood: ['wood', 'plank', 'timber'],
  brick: ['brick', 'castle', 'dungeon'],
  metal: ['metal', 'iron', 'steel'],
  crystal: ['crystal', 'gem', 'magic']
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
 * Detect if a tileset follows Kenney naming conventions
 */
export function detectKenneyTileset(assetName: string): boolean {
  const kenneyIndicators = [
    /kenney/i,
    /\btile(set)?_?\d+/i, // tile_001, tileset123
    /(top.?down|platform|rpg).?pack/i,
    /nature.?pack/i,
    /dungeon.?pack/i
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
  const baseMaterial = detectedMaterial || 'tile'
  
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
    // Unknown system - use generic numbering
    for (let i = 0; i < tileCount; i++) {
      namedTiles[`${baseMaterial}.tile_${i}`] = i
    }
  }
  
  return namedTiles
}

/**
 * Detect material from asset name
 */
export function detectMaterialFromName(assetName: string): string | undefined {
  const nameLower = assetName.toLowerCase()
  
  for (const [material, keywords] of Object.entries(KENNEY_MATERIALS)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      return material
    }
  }
  
  return undefined
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
  const detectedMaterial = detectMaterialFromName(assetName)
  const themes = detectThemeFromName(assetName)
  const materials = detectedMaterial ? [detectedMaterial] : []
  const layerTypes = suggestLayerTypes(assetName, tileCount)
  const namedTiles = generateKenneyNamedTiles(assetName, tileCount, detectedMaterial)
  
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

