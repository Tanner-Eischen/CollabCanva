import type { Asset, AssetAIContextPayload, TilesetSuggestion } from '../../types/asset'

/**
 * Build AI-facing asset context from the current asset library.
 * Summarises tileset availability so the AI can pick appropriate tiles when generating maps.
 */
export function buildAssetAIContext(
  assets: Asset[],
  options: { tileSize?: number } = {}
): AssetAIContextPayload {
  const tilesets = assets.filter(asset => asset.type === 'tileset' && asset.tilesetMetadata)
  const spritesheets = assets.filter(asset => asset.type === 'spritesheet')

  const availableTileSizes = new Set<number>()
  const availableThemes = new Set<string>()
  const availableMaterials = new Set<string>()

  let hasAutotileSets = false
  let hasAnimatedSets = false
  let hasPropSets = false

  tilesets.forEach(asset => {
    const metadata = asset.tilesetMetadata!

    if (metadata.tileWidth === metadata.tileHeight) {
      availableTileSizes.add(metadata.tileWidth)
    } else {
      availableTileSizes.add(Math.max(metadata.tileWidth, metadata.tileHeight))
    }

    metadata.themes?.forEach(theme => availableThemes.add(theme))
    metadata.materials?.forEach(material => availableMaterials.add(material))

    if (metadata.features?.autotile) hasAutotileSets = true
    if (metadata.features?.animated) hasAnimatedSets = true
    if (metadata.features?.props) hasPropSets = true
  })

  const assetStats: AssetAIContextPayload['assetStats'] = {
    totalTilesets: tilesets.length,
    availableTileSizes: Array.from(availableTileSizes).sort((a, b) => a - b),
    availableThemes: Array.from(availableThemes).sort(),
    availableMaterials: Array.from(availableMaterials).sort(),
    hasAutotileSets,
    hasAnimatedSets,
    hasPropSets,
  }

  const availableAssets: AssetAIContextPayload['availableAssets'] = {
    tilesets: tilesets.length,
    spritesheets: spritesheets.length,
    animations: 0, // Animations are stored separately – not yet tracked on the client
  }

  const tilesetSuggestions: TilesetSuggestion[] = []

  if (options.tileSize) {
    const matchingTilesets = tilesets.filter(asset => {
      const metadata = asset.tilesetMetadata!
      return (
        metadata.tileWidth === options.tileSize ||
        metadata.tileHeight === options.tileSize ||
        metadata.tileSize === options.tileSize
      )
    })

    matchingTilesets.slice(0, 3).forEach(asset => {
      const metadata = asset.tilesetMetadata!
      const themes = metadata.themes?.slice(0, 2).join(', ')
      const materials = metadata.materials?.slice(0, 2).join(', ')

      const reasonParts: string[] = [`matches ${options.tileSize}px tiles`]
      if (themes) reasonParts.push(`themes: ${themes}`)
      if (materials) reasonParts.push(`materials: ${materials}`)
      if (metadata.features?.autotile) reasonParts.push('auto-tiling ready')

      tilesetSuggestions.push({
        id: asset.id,
        name: asset.name,
        reason: reasonParts.join(', '),
      })
    })
  }

  return {
    availableAssets,
    assetStats,
    tilesetSuggestions: tilesetSuggestions.length > 0 ? tilesetSuggestions : undefined,
  }
}

