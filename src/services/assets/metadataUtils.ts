/**
 * Metadata Utilities for Asset Management
 * Provides helper functions for metadata cloning, semantic naming, and grouping
 */

import type {
  TilesetMetadata,
  SpriteSheetMetadata,
  SpriteSelection,
  TileSemanticGroup,
  TileSlice
} from '../../types/asset'

/**
 * Summary of sprite renaming operations
 */
export interface SpriteRenamingSummary {
  renamedCount: number
  skippedCount: number
  renames: Array<{ oldName: string; newName: string }>
  sampleNames: string[]
}

export function getSemanticVariantKey(tileName: string): string {
  const parts = tileName.split(/[._-]/)
  return parts.slice(1).join('_') || 'base'
}

/**
 * Deep clone tileset metadata to avoid mutations
 */
export function cloneTilesetMetadata(metadata: TilesetMetadata): TilesetMetadata {
  const cloned: TilesetMetadata = {
    tileWidth: metadata.tileWidth,
    tileHeight: metadata.tileHeight,
    columns: metadata.columns,
    rows: metadata.rows,
    tileCount: metadata.tileCount,
    ...(metadata.spacing !== undefined ? { spacing: metadata.spacing } : {}),
    ...(metadata.margin !== undefined ? { margin: metadata.margin } : {})
  }

  if (metadata.autoTileMapping) {
    cloned.autoTileMapping = { ...metadata.autoTileMapping }
  }

  if (metadata.tileSize !== undefined) {
    cloned.tileSize = metadata.tileSize
  }

  if (metadata.version !== undefined) {
    cloned.version = metadata.version
  }

  if (metadata.pixelArt !== undefined) {
    cloned.pixelArt = metadata.pixelArt
  }

  if (metadata.palette) {
    cloned.palette = [...metadata.palette]
  }

  if (metadata.themes) {
    cloned.themes = [...metadata.themes]
  }

  if (metadata.styles) {
    cloned.styles = [...metadata.styles]
  }

  if (metadata.materials) {
    cloned.materials = [...metadata.materials]
  }

  if (metadata.layerTypes) {
    cloned.layerTypes = [...metadata.layerTypes]
  }

  if (metadata.autoTileSystem) {
    cloned.autoTileSystem = metadata.autoTileSystem
  }

  if (metadata.tiles) {
    cloned.tiles = metadata.tiles.map(tile => ({
      index: tile.index,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height
    }))
  }

  if (metadata.namedTiles) {
    cloned.namedTiles = { ...metadata.namedTiles }
  }

  if (metadata.tileGroups) {
    cloned.tileGroups = cloneTileSemanticGroups(metadata.tileGroups)
  }

  if (metadata.adjacencyRules) {
    cloned.adjacencyRules = {
      system: metadata.adjacencyRules.system,
      rulesData: metadata.adjacencyRules.rulesData,
      rulesUrl: metadata.adjacencyRules.rulesUrl
    }
  }

  if (metadata.features) {
    cloned.features = { ...metadata.features }
  }

  if (metadata.validation) {
    cloned.validation = {
      seamQuality: metadata.validation.seamQuality,
      dimensionCheck: metadata.validation.dimensionCheck,
      warnings: [...metadata.validation.warnings],
      checkedAt: metadata.validation.checkedAt
    }
  }

  if (metadata.detectionConfidence) {
    cloned.detectionConfidence = { ...metadata.detectionConfidence }
  }

  return cloned
}

/**
 * Deep clone sprite sheet metadata to avoid mutations
 */
export function cloneSpriteSheetMetadata(metadata: SpriteSheetMetadata): SpriteSheetMetadata {
  const cloned: SpriteSheetMetadata = {
    ...(metadata.frameWidth !== undefined ? { frameWidth: metadata.frameWidth } : {}),
    ...(metadata.frameHeight !== undefined ? { frameHeight: metadata.frameHeight } : {}),
    ...(metadata.frameCount !== undefined ? { frameCount: metadata.frameCount } : {}),
    ...(metadata.columns !== undefined ? { columns: metadata.columns } : {}),
    ...(metadata.rows !== undefined ? { rows: metadata.rows } : {}),
    ...(metadata.spacing !== undefined ? { spacing: metadata.spacing } : {}),
    ...(metadata.margin !== undefined ? { margin: metadata.margin } : {})
  }

  if (metadata.spriteSelections) {
    cloned.spriteSelections = metadata.spriteSelections.map(sprite => ({
      ...sprite,
      ...(sprite.dominantColors ? { dominantColors: [...sprite.dominantColors] } : {}),
      ...(sprite.tags ? { tags: [...sprite.tags] } : {})
    }))
  }

  if (metadata.selectionMode) {
    cloned.selectionMode = metadata.selectionMode
  }

  if (metadata.palette) {
    cloned.palette = [...metadata.palette]
  }

  if (metadata.inferredMaterials) {
    cloned.inferredMaterials = [...metadata.inferredMaterials]
  }

  if (metadata.inferredThemes) {
    cloned.inferredThemes = [...metadata.inferredThemes]
  }

  return cloned
}

/**
 * Deep clone semantic groups
 */
function cloneTileSemanticGroups(
  groups: Record<string, TileSemanticGroup>
): Record<string, TileSemanticGroup> {
  const cloned: Record<string, TileSemanticGroup> = {}
  for (const [key, group] of Object.entries(groups)) {
    cloned[key] = {
      label: group.label,
      description: group.description,
      autoTileSystem: group.autoTileSystem,
      materials: group.materials ? [...group.materials] : undefined,
      themes: group.themes ? [...group.themes] : undefined,
      tiles: { ...group.tiles },
      variants: [...group.variants],
      tileCount: group.tileCount
    }
  }
  return cloned
}

/**
 * Apply semantic naming to sprite selections based on namedTiles mapping
 * Returns a summary of what was renamed
 */
export function applySemanticNamingToSprites(
  spriteSelections: SpriteSelection[],
  namedTiles: Record<string, number | string>,
  baseFileName: string
): SpriteRenamingSummary {
  // Create reverse mapping: index → semantic name
  const indexToName: Record<number, string> = {}

  for (const [semanticName, index] of Object.entries(namedTiles)) {
    const numIndex = typeof index === 'number' ? index : parseInt(index, 10)
    if (!isNaN(numIndex)) {
      // Clean up the semantic name (remove dots, lowercase, replace spaces with underscores)
      const cleanName = semanticName
        .replace(/\./g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase()
      indexToName[numIndex] = cleanName
    }
  }

  const renames: Array<{ oldName: string; newName: string }> = []
  let renamedCount = 0
  let skippedCount = 0

  spriteSelections.forEach((sprite, index) => {
    if (indexToName[index]) {
      const oldName = sprite.name
      const newName = `${baseFileName}_${indexToName[index]}`
      sprite.name = newName
      renames.push({ oldName, newName })
      renamedCount++
    } else {
      skippedCount++
    }
  })

  const sampleNames = spriteSelections.slice(0, 5).map(sprite => sprite.name)

  return {
    renamedCount,
    skippedCount,
    renames,
    sampleNames,
  }
}

/**
 * Build semantic tile groups from named tiles metadata
 * Groups tiles by material/theme/auto-tile system
 */
export function buildTileSemanticGroups(
  namedTiles: Record<string, number>,
  context?: {
    materials?: string[]
    themes?: string[]
    autoTileSystem?: string
  }
): Record<string, TileSemanticGroup> {
  const groups: Record<string, TileSemanticGroup> = {}

  // Extract tile names and group by prefix (e.g., "grass_center" -> group "grass")
  for (const [name, index] of Object.entries(namedTiles)) {
    // Split by common delimiters
    const parts = name.split(/[._-]/)
    if (parts.length > 0) {
      const groupKey = parts[0].toLowerCase()

      if (!groups[groupKey]) {
        const materialMatches = context?.materials?.filter(material =>
          material.toLowerCase().includes(groupKey)
        )

        groups[groupKey] = {
          label: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
          description: `Tiles in the ${groupKey} group`,
          autoTileSystem: (context?.autoTileSystem as 'blob16' | 'blob47' | 'wang' | 'custom' | undefined),
          materials: materialMatches && materialMatches.length > 0 ? materialMatches : context?.materials,
          themes: context?.themes,
          tiles: {},
          variants: [],
          tileCount: 0
        }
      }

      // Add tile to group
      groups[groupKey].tiles[name] = typeof index === 'number' ? index : parseInt(String(index), 10)
      const variantKey = getSemanticVariantKey(name)

      if (!groups[groupKey].variants.includes(variantKey)) {
        groups[groupKey].variants.push(variantKey)
      }
      groups[groupKey].tileCount = Object.keys(groups[groupKey].tiles).length
    }
  }

  return groups
}

/**
 * Generate tile slice coordinates from tileset metadata
 */
export function generateTileSlicesFromMetadata(
  metadata: Pick<
    TilesetMetadata,
    'tileWidth' | 'tileHeight' | 'columns' | 'rows' | 'spacing' | 'margin'
  >
): TileSlice[] {
  const {
    tileWidth,
    tileHeight,
    columns,
    rows,
    spacing = 0,
    margin = 0
  } = metadata

  if (!tileWidth || !tileHeight || !columns || !rows) {
    return []
  }

  const slices: TileSlice[] = []
  let index = 0

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = margin + col * (tileWidth + spacing)
      const y = margin + row * (tileHeight + spacing)

      slices.push({
        index,
        x,
        y,
        width: tileWidth,
        height: tileHeight
      })

      index++
    }
  }

  return slices
}
