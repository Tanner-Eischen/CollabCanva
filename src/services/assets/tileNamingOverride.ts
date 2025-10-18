/**
 * Tile Naming Override Service
 * Allows manual override of tile names for better AI integration
 * Users can customize semantic tile names if auto-detection doesn't work well
 */

import { ref as dbRef, update } from 'firebase/database'
import { db } from '../firebase'
import type { Asset } from '../../types/asset'
import { getSemanticVariantKey } from './metadataUtils'

// Import or define getAsset function
// For now, we'll assume it's imported from assetUpload
import { getAsset } from './assetUpload'

export interface TileNameOverride {
  tileIndex: number
  semanticName: string
  category?: string
  description?: string
}

export interface NameOverrideResult {
  success: boolean
  appliedCount: number
  message: string
}

/**
 * Apply manual tile naming overrides
 * Updates namedTiles map with user-provided names
 */
export async function applyTileNameOverrides(
  assetId: string,
  userId: string,
  overrides: TileNameOverride[]
): Promise<NameOverrideResult> {
  try {
    const asset = await getAsset(assetId, userId)
    
    if (!asset?.tilesetMetadata) {
      return {
        success: false,
        appliedCount: 0,
        message: 'Asset does not have tileset metadata',
      }
    }

    const metadata = asset.tilesetMetadata
    const namedTiles = { ...metadata.namedTiles || {} }
    const tileGroups = { ...metadata.tileGroups || {} }

    console.log(`🏷️ Applying ${overrides.length} manual naming overrides...`)

    let appliedCount = 0

    for (const override of overrides) {
      // Remove old names for this index
      const oldNames = Object.keys(namedTiles).filter(
        (name) => namedTiles[name] === override.tileIndex
      )

      oldNames.forEach((name) => {
        delete namedTiles[name]
        
        // Remove from tile groups if present
        Object.entries(tileGroups).forEach(([groupKey, group]) => {
          if (group.tiles && name in group.tiles) {
            delete group.tiles[name]
            const variantKey = getSemanticVariantKey(name)
            group.variants = group.variants.filter(v => v !== variantKey)
            group.tileCount = Object.keys(group.tiles).length
          }
        })
      })

      // Add new name
      namedTiles[override.semanticName] = override.tileIndex
      
      // Add to category if specified
      if (override.category) {
        if (!tileGroups[override.category]) {
          tileGroups[override.category] = {
            label: override.category.charAt(0).toUpperCase() + override.category.slice(1),
            description: `Category: ${override.category}`,
            tiles: {},
            variants: [],
            tileCount: 0
          }
        }
        const group = tileGroups[override.category]
        group.tiles[override.semanticName] = override.tileIndex
        const variantKey = getSemanticVariantKey(override.semanticName)
        if (!group.variants.includes(variantKey)) {
          group.variants.push(variantKey)
        }
        group.tileCount = Object.keys(group.tiles).length
      }

      appliedCount++
      console.log(
        `  ✅ Tile ${override.tileIndex}: ${oldNames.join(', ') || '(unnamed)'} → ${override.semanticName}`
      )
    }

    // Update asset in Firebase
    const assetRef = dbRef(db, `assets/${userId}/${assetId}`)
    await update(assetRef, {
      'tilesetMetadata.namedTiles': namedTiles,
      'tilesetMetadata.tileGroups': tileGroups,
      'tilesetMetadata.hasManualOverrides': true,
      'tilesetMetadata.overridesAppliedAt': Date.now(),
      updatedAt: Date.now(),
    })

    const message = `Applied ${appliedCount} manual naming override(s) successfully`
    console.log(`✅ ${message}`)

    return {
      success: true,
      appliedCount,
      message,
    }
  } catch (error: any) {
    console.error('Failed to apply tile name overrides:', error)
    return {
      success: false,
      appliedCount: 0,
      message: `Error: ${error.message}`,
    }
  }
}

/**
 * Batch apply multiple override sets
 * Useful for updating many tiles at once
 */
export async function batchApplyOverrides(
  assetId: string,
  userId: string,
  overrideSets: TileNameOverride[][]
): Promise<NameOverrideResult> {
  const allOverrides = overrideSets.flat()
  return applyTileNameOverrides(assetId, userId, allOverrides)
}

/**
 * Get suggested names for a tile based on color analysis
 * Uses naive color classification to suggest semantic names
 */
export function suggestTileNames(
  tileIndex: number,
  dominantColor: { r: number; g: number; b: number },
  context?: {
    assetName?: string
    category?: string
  }
): string[] {
  const suggestions: string[] = []
  const { r, g, b } = dominantColor

  // Analyze dominant color
  const avg = (r + g + b) / 3
  const isGreen = g > r && g > b
  const isBrown = r > 100 && g > 50 && b < 100
  const isBlue = b > r && b > g
  const isGray = Math.abs(r - g) < 20 && Math.abs(g - b) < 20
  const isDark = avg < 85

  // Generate suggestions based on color
  if (isGreen) {
    suggestions.push('grass', 'grass.center', 'vegetation', 'foliage')
  } else if (isBrown) {
    suggestions.push('dirt', 'earth', 'soil', 'stone', 'rock')
  } else if (isBlue) {
    suggestions.push('water', 'water.center', 'ocean', 'sea')
  } else if (isGray && isDark) {
    suggestions.push('stone', 'rock', 'pavement', 'wall')
  } else if (isGray) {
    suggestions.push('concrete', 'floor', 'platform')
  }

  // Add positional variants
  suggestions.forEach((base) => {
    suggestions.push(`${base}.center`)
    suggestions.push(`${base}.edge_n`)
    suggestions.push(`${base}.edge_s`)
    suggestions.push(`${base}.edge_e`)
    suggestions.push(`${base}.edge_w`)
  })

  // If we have context, add more specific names
  if (context?.assetName) {
    const baseName = context.assetName.split('_')[0].toLowerCase()
    suggestions.unshift(`${baseName}.center`)
  }

  // Remove duplicates and return top suggestions
  return [...new Set(suggestions)].slice(0, 5)
}

/**
 * Create override suggestions for unnamed tiles
 * Analyzes tile colors and suggests names
 */
export function generateOverrideSuggestions(
  unnamedTileIndices: number[],
  tileColors: Map<number, { r: number; g: number; b: number }>,
  assetName?: string
): TileNameOverride[] {
  const suggestions: TileNameOverride[] = []

  for (const index of unnamedTileIndices) {
    const color = tileColors.get(index)
    if (!color) continue

    const suggested = suggestTileNames(index, color, { assetName })
    
    if (suggested.length > 0) {
      suggestions.push({
        tileIndex: index,
        semanticName: suggested[0], // Use best suggestion
        category: suggested[0].split('.')[0],
        description: `Suggested based on dominant color`,
      })
    }
  }

  return suggestions
}

/**
 * Revert to auto-detected naming
 * Removes manual overrides and re-applies auto-detection
 */
export async function revertToAutoNaming(
  assetId: string,
  userId: string
): Promise<NameOverrideResult> {
  try {
    const asset = await getAsset(assetId, userId)
    
    if (!asset?.tilesetMetadata) {
      return {
        success: false,
        appliedCount: 0,
        message: 'Asset does not have tileset metadata',
      }
    }

    // Store original auto-detected names
    const metadata = asset.tilesetMetadata
    const originalNamed = metadata.namedTiles || {}

    console.log(`♻️ Reverting to auto-detected naming...`)

    // Update asset to remove manual override flag
    const assetRef = dbRef(db, `assets/${userId}/${assetId}`)
    await update(assetRef, {
      'tilesetMetadata.hasManualOverrides': false,
      'tilesetMetadata.overridesRemovedAt': Date.now(),
      updatedAt: Date.now(),
    })

    console.log(`✅ Reverted to auto-detected naming`)

    return {
      success: true,
      appliedCount: Object.keys(originalNamed).length,
      message: 'Reverted to auto-detected naming',
    }
  } catch (error: any) {
    console.error('Failed to revert to auto naming:', error)
    return {
      success: false,
      appliedCount: 0,
      message: `Error: ${error.message}`,
    }
  }
}
