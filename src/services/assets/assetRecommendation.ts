/**
 * Asset Recommendation Service
 * AI-powered tileset selection based on context
 */

import { loadUserCatalog } from './assetCatalog'
import { getAsset } from './assetUpload'
import type { Asset, TilesetCatalogEntry, TilesetQuery } from '../../types/asset'

/**
 * Recommend tilesets based on query
 */
export async function recommendTilesets(
  userId: string,
  query: TilesetQuery,
  limit: number = 5
): Promise<Asset[]> {
  // Load catalog (fast, ~1-2KB per entry)
  const catalog = await loadUserCatalog(userId)
  
  if (catalog.length === 0) {
    return []
  }
  
  // Filter by hard requirements
  let candidates = filterCatalog(catalog, query)
  
  if (candidates.length === 0) {
    return []
  }
  
  // Score by relevance
  const scored = candidates.map(entry => ({
    entry,
    score: scoreRelevance(entry, query)
  }))
  
  // Sort and limit
  const topEntries = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.entry)
  
  // Load full assets
  const assets = await Promise.all(
    topEntries.map(entry => getAsset(entry.id, userId))
  )
  
  return assets.filter(Boolean) as Asset[]
}

/**
 * Filter catalog by hard requirements
 */
function filterCatalog(catalog: TilesetCatalogEntry[], query: TilesetQuery): TilesetCatalogEntry[] {
  return catalog.filter(entry => {
    // Tile size match (strict)
    if (query.tileSize !== undefined && entry.tileSize !== query.tileSize) {
      return false
    }
    
    // Exact dimensions (if specified)
    if (query.tileWidth !== undefined && entry.tileWidth !== query.tileWidth) {
      return false
    }
    if (query.tileHeight !== undefined && entry.tileHeight !== query.tileHeight) {
      return false
    }
    
    // Layer type
    if (query.layer && !entry.layerTypes.includes(query.layer)) {
      return false
    }
    
    // Feature requirements
    if (query.requireAutotile && !entry.features.autotile) {
      return false
    }
    if (query.requireAnimated && !entry.features.animated) {
      return false
    }
    if (query.requireProps && !entry.features.props) {
      return false
    }
    
    // Material exclusions
    if (query.excludeMaterials) {
      if (query.excludeMaterials.some(m => entry.materials.includes(m))) {
        return false
      }
    }
    
    // Text search
    if (query.searchQuery) {
      const searchLower = query.searchQuery.toLowerCase()
      const matchesName = entry.name.toLowerCase().includes(searchLower)
      const matchesMaterial = entry.materials.some(m => m.toLowerCase().includes(searchLower))
      const matchesTheme = entry.themes.some(t => t.toLowerCase().includes(searchLower))
      
      if (!matchesName && !matchesMaterial && !matchesTheme) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Score catalog entry relevance to query
 */
function scoreRelevance(entry: TilesetCatalogEntry, query: TilesetQuery): number {
  let score = 0
  
  // Base score from detection confidence
  if (entry.detectionConfidence) {
    score += entry.detectionConfidence * 2
  }
  
  // Theme match (high weight)
  if (query.theme && entry.themes.includes(query.theme)) {
    score += 10
  }
  if (query.themes) {
    const themeMatches = query.themes.filter(t => entry.themes.includes(t)).length
    score += themeMatches * 5
  }
  
  // Style match
  if (query.style && entry.styles.includes(query.style)) {
    score += 5
  }
  
  // Material matches (medium weight)
  if (query.materials) {
    const materialMatches = query.materials.filter(m => entry.materials.includes(m)).length
    score += materialMatches * 3
  }
  
  // Feature bonuses
  if (entry.features.autotile) score += 2
  if (entry.features.animated) score += 1
  if (entry.features.props) score += 1
  if (entry.features.decals) score += 0.5
  
  // Auto-tile system bonus
  if (entry.autoTileSystem === 'blob47') score += 3
  else if (entry.autoTileSystem === 'blob16') score += 2
  else if (entry.autoTileSystem === 'wang') score += 2
  
  // Recency bonus (newer assets slightly preferred)
  const daysSinceUpdate = (Date.now() - entry.updatedAt) / (1000 * 60 * 60 * 24)
  if (daysSinceUpdate < 7) score += 1
  else if (daysSinceUpdate < 30) score += 0.5
  
  return score
}

/**
 * Find best single tileset
 */
export async function findBestTileset(
  userId: string,
  query: TilesetQuery
): Promise<Asset | null> {
  const results = await recommendTilesets(userId, query, 1)
  return results[0] || null
}

/**
 * Get tileset suggestions for AI context
 */
export async function getTilesetSuggestions(
  userId: string,
  context: {
    mapTileSize?: number
    currentLayer?: string
    recentMaterials?: string[]
  }
): Promise<Array<{ asset: Asset; reason: string }>> {
  const catalog = await loadUserCatalog(userId)
  
  const suggestions: Array<{ asset: Asset; reason: string }> = []
  
  // Suggest based on map tile size
  if (context.mapTileSize) {
    const sizeMatches = catalog.filter(e => e.tileSize === context.mapTileSize)
    if (sizeMatches.length > 0) {
      const asset = await getAsset(sizeMatches[0].id, userId)
      if (asset) {
        suggestions.push({
          asset,
          reason: `Matches your map tile size (${context.mapTileSize}px)`
        })
      }
    }
  }
  
  // Suggest based on current layer
  if (context.currentLayer) {
    const layerMatches = catalog.filter(e => e.layerTypes.includes(context.currentLayer!))
    if (layerMatches.length > 0) {
      const asset = await getAsset(layerMatches[0].id, userId)
      if (asset) {
        suggestions.push({
          asset,
          reason: `Suitable for ${context.currentLayer} layer`
        })
      }
    }
  }
  
  // Suggest based on recent materials
  if (context.recentMaterials && context.recentMaterials.length > 0) {
    const materialMatches = catalog.filter(e =>
      context.recentMaterials!.some(m => e.materials.includes(m))
    )
    if (materialMatches.length > 0) {
      const asset = await getAsset(materialMatches[0].id, userId)
      if (asset) {
        suggestions.push({
          asset,
          reason: `Contains materials you've been using: ${context.recentMaterials.join(', ')}`
        })
      }
    }
  }
  
  return suggestions.slice(0, 3)  // Max 3 suggestions
}

