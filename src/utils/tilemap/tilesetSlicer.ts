/**
 * Tileset Slicer Utility (PR-31)
 * Auto-detects and slices sprite sheets/tilesets into individual tiles
 */

import type {
  TileSliceResult,
  TileSlice,
  TilesetMetadata,
  AutoTileSuggestion,
  AutoTileMapping
} from '../../types/asset'

/**
 * Common tile sizes to check when auto-detecting
 */
const COMMON_TILE_SIZES = [8, 16, 24, 32, 48, 64, 128]

/**
 * Load image from URL
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

/**
 * Get image data from image element
 */
export function getImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}

/**
 * Auto-detect tile size from image
 * Looks for grid patterns and common tile sizes
 */
export function autoDetectTileSize(imageData: ImageData): {
  tileWidth: number
  tileHeight: number
  spacing: number
  margin: number
  confidence: number
} {
  const { width, height, data } = imageData
  let bestMatch = {
    tileWidth: 32,
    tileHeight: 32,
    spacing: 0,
    margin: 0,
    confidence: 0
  }

  // Try each common tile size
  for (const tileSize of COMMON_TILE_SIZES) {
    // Skip if image is smaller than tile size
    if (width < tileSize || height < tileSize) continue

    // Try with no spacing
    const noSpacingScore = calculateGridScore(imageData, tileSize, tileSize, 0, 0)
    if (noSpacingScore > bestMatch.confidence) {
      bestMatch = {
        tileWidth: tileSize,
        tileHeight: tileSize,
        spacing: 0,
        margin: 0,
        confidence: noSpacingScore
      }
    }

    // Try with 1px spacing
    const onePixelSpacingScore = calculateGridScore(imageData, tileSize, tileSize, 1, 0)
    if (onePixelSpacingScore > bestMatch.confidence) {
      bestMatch = {
        tileWidth: tileSize,
        tileHeight: tileSize,
        spacing: 1,
        margin: 0,
        confidence: onePixelSpacingScore
      }
    }

    // Try with 2px spacing
    const twoPixelSpacingScore = calculateGridScore(imageData, tileSize, tileSize, 2, 0)
    if (twoPixelSpacingScore > bestMatch.confidence) {
      bestMatch = {
        tileWidth: tileSize,
        tileHeight: tileSize,
        spacing: 2,
        margin: 0,
        confidence: twoPixelSpacingScore
      }
    }

    // Try with 1px margin
    const onePixelMarginScore = calculateGridScore(imageData, tileSize, tileSize, 0, 1)
    if (onePixelMarginScore > bestMatch.confidence) {
      bestMatch = {
        tileWidth: tileSize,
        tileHeight: tileSize,
        spacing: 0,
        margin: 1,
        confidence: onePixelMarginScore
      }
    }
  }

  // If no good match found, try to find divisors
  if (bestMatch.confidence < 0.5) {
    const divisorResult = findBestDivisors(width, height)
    return {
      ...divisorResult,
      confidence: 0.3
    }
  }

  return bestMatch
}

/**
 * Calculate how well a tile size fits the image grid
 */
function calculateGridScore(
  imageData: ImageData,
  tileWidth: number,
  tileHeight: number,
  spacing: number,
  margin: number
): number {
  const { width, height } = imageData

  // Calculate how many complete tiles fit
  const tilesX = Math.floor((width - 2 * margin + spacing) / (tileWidth + spacing))
  const tilesY = Math.floor((height - 2 * margin + spacing) / (tileHeight + spacing))

  if (tilesX < 1 || tilesY < 1) return 0

  // Calculate how much of the image is covered
  const usedWidth = margin * 2 + tilesX * tileWidth + (tilesX - 1) * spacing
  const usedHeight = margin * 2 + tilesY * tileHeight + (tilesY - 1) * spacing
  
  const coverageX = usedWidth / width
  const coverageY = usedHeight / height
  
  // Perfect coverage (100%) = score of 1.0
  // We want coverage close to 1.0
  const coverage = (coverageX + coverageY) / 2
  
  // Bonus for covering more of the image
  const remainderX = width - usedWidth
  const remainderY = height - usedHeight
  const remainderScore = 1 - ((remainderX + remainderY) / (width + height))

  // Check for grid separator lines (darker pixels)
  let separatorScore = 0
  if (spacing > 0) {
    separatorScore = checkForSeparatorLines(imageData, tileWidth, tileHeight, spacing, margin)
  }

  // Combine scores
  return (coverage * 0.6) + (remainderScore * 0.3) + (separatorScore * 0.1)
}

/**
 * Check if there are separator lines between tiles
 */
function checkForSeparatorLines(
  imageData: ImageData,
  tileWidth: number,
  tileHeight: number,
  spacing: number,
  margin: number
): number {
  const { width, height, data } = imageData
  let separatorPixels = 0
  let totalSeparatorPixels = 0

  // Check vertical separators
  for (let col = 0; col < Math.floor((width - margin) / (tileWidth + spacing)); col++) {
    const x = margin + col * (tileWidth + spacing) + tileWidth
    if (x >= width) break

    for (let y = margin; y < height - margin; y++) {
      const idx = (y * width + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      totalSeparatorPixels++
      
      // Dark pixels (likely separators)
      if (brightness < 100) {
        separatorPixels++
      }
    }
  }

  // Check horizontal separators
  for (let row = 0; row < Math.floor((height - margin) / (tileHeight + spacing)); row++) {
    const y = margin + row * (tileHeight + spacing) + tileHeight
    if (y >= height) break

    for (let x = margin; x < width - margin; x++) {
      const idx = (y * width + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      totalSeparatorPixels++
      
      if (brightness < 100) {
        separatorPixels++
      }
    }
  }

  if (totalSeparatorPixels === 0) return 0
  return separatorPixels / totalSeparatorPixels
}

/**
 * Find best divisors for image dimensions
 */
function findBestDivisors(width: number, height: number): {
  tileWidth: number
  tileHeight: number
  spacing: number
  margin: number
} {
  // Find common divisors
  const divisorsW: number[] = []
  const divisorsH: number[] = []

  for (let i = 8; i <= Math.min(width / 2, 128); i++) {
    if (width % i === 0) divisorsW.push(i)
    if (height % i === 0) divisorsH.push(i)
  }

  // Prefer square tiles
  const commonDivisors = divisorsW.filter(d => divisorsH.includes(d))
  if (commonDivisors.length > 0) {
    // Pick middle divisor (not too small, not too large)
    const middleIndex = Math.floor(commonDivisors.length / 2)
    return {
      tileWidth: commonDivisors[middleIndex],
      tileHeight: commonDivisors[middleIndex],
      spacing: 0,
      margin: 0
    }
  }

  // Fallback to 32x32
  return {
    tileWidth: 32,
    tileHeight: 32,
    spacing: 0,
    margin: 0
  }
}

/**
 * Slice tileset into individual tiles
 */
export function sliceTileset(
  imageData: ImageData,
  tileWidth: number,
  tileHeight: number,
  spacing: number = 0,
  margin: number = 0
): TileSliceResult {
  const { width, height } = imageData
  const tiles: TileSlice[] = []

  const columns = Math.floor((width - 2 * margin + spacing) / (tileWidth + spacing))
  const rows = Math.floor((height - 2 * margin + spacing) / (tileHeight + spacing))
  const tileCount = columns * rows

  let index = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = margin + col * (tileWidth + spacing)
      const y = margin + row * (tileHeight + spacing)

      tiles.push({
        index,
        x,
        y,
        width: tileWidth,
        height: tileHeight
      })

      index++
    }
  }

  const metadata: TilesetMetadata = {
    tileWidth,
    tileHeight,
    spacing,
    margin,
    columns,
    rows,
    tileCount
  }

  return {
    tiles,
    metadata
  }
}

/**
 * Extract tile image data from tileset
 */
export function extractTileImageData(
  imageData: ImageData,
  tile: TileSlice
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = tile.width
  canvas.height = tile.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Create a temporary canvas with the full image
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = imageData.width
  tempCanvas.height = imageData.height
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) {
    throw new Error('Failed to get temp canvas context')
  }
  tempCtx.putImageData(imageData, 0, 0)

  // Draw the tile region
  ctx.drawImage(
    tempCanvas,
    tile.x, tile.y, tile.width, tile.height,
    0, 0, tile.width, tile.height
  )

  return ctx.getImageData(0, 0, tile.width, tile.height)
}

/**
 * Detect auto-tile variants using image similarity
 * Groups similar tiles that might form auto-tile sets
 */
export function detectAutoTileVariants(
  imageData: ImageData,
  tiles: TileSlice[]
): AutoTileSuggestion[] {
  const suggestions: AutoTileSuggestion[] = []

  // Standard 16-tile auto-tile set
  if (tiles.length >= 16) {
    // Check if first 16 tiles look like an auto-tile set
    const firstSetTiles = tiles.slice(0, 16)
    const similarity = calculateTileSetSimilarity(imageData, firstSetTiles)
    
    if (similarity > 0.6) {
      const mapping: AutoTileMapping = {}
      for (let i = 0; i < 16; i++) {
        mapping[i] = i
      }
      
      suggestions.push({
        tileIndices: firstSetTiles.map(t => t.index),
        confidence: similarity,
        mapping
      })
    }
  }

  // Look for 4-tile mini sets (corners)
  for (let i = 0; i <= tiles.length - 4; i += 4) {
    const miniSet = tiles.slice(i, i + 4)
    const similarity = calculateTileSetSimilarity(imageData, miniSet)
    
    if (similarity > 0.7) {
      suggestions.push({
        tileIndices: miniSet.map(t => t.index),
        confidence: similarity
      })
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Calculate similarity between tiles in a set
 * Higher values mean tiles are more likely to be variants
 */
function calculateTileSetSimilarity(
  imageData: ImageData,
  tiles: TileSlice[]
): number {
  if (tiles.length < 2) return 0

  // Extract color palette from all tiles
  const palettes = tiles.map(tile => {
    const tileData = extractTileImageData(imageData, tile)
    return extractColorPalette(tileData)
  })

  // Check if tiles share similar color palettes
  let totalSimilarity = 0
  let comparisons = 0

  for (let i = 0; i < palettes.length - 1; i++) {
    for (let j = i + 1; j < palettes.length; j++) {
      totalSimilarity += comparePalettes(palettes[i], palettes[j])
      comparisons++
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0
}

/**
 * Extract dominant colors from tile
 */
function extractColorPalette(imageData: ImageData, maxColors: number = 8): string[] {
  const { data } = imageData
  const colorCounts = new Map<string, number>()

  for (let i = 0; i < data.length; i += 4) {
    // Skip transparent pixels
    if (data[i + 3] < 128) continue

    const color = `${data[i]},${data[i + 1]},${data[i + 2]}`
    colorCounts.set(color, (colorCounts.get(color) || 0) + 1)
  }

  // Sort by frequency and take top colors
  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([color]) => color)
}

/**
 * Compare two color palettes
 */
function comparePalettes(palette1: string[], palette2: string[]): number {
  const set1 = new Set(palette1)
  const set2 = new Set(palette2)
  
  let matches = 0
  for (const color of set1) {
    if (set2.has(color)) matches++
  }

  const union = new Set([...set1, ...set2])
  return matches / union.size
}

/**
 * Generate standard 16-tile auto-tile mapping
 * Based on blob tileset layout
 */
export function generateStandardAutoTileMapping(startIndex: number = 0): AutoTileMapping {
  // Standard 16-tile layout (4x4 grid)
  // Bitmask order: [0-15]
  const mapping: AutoTileMapping = {}
  
  for (let i = 0; i < 16; i++) {
    mapping[i] = startIndex + i
  }
  
  return mapping
}

/**
 * Validate tileset configuration
 */
export function validateTilesetConfig(
  imageWidth: number,
  imageHeight: number,
  tileWidth: number,
  tileHeight: number,
  spacing: number,
  margin: number
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (tileWidth < 1 || tileHeight < 1) {
    errors.push('Tile dimensions must be at least 1x1 pixels')
  }

  if (tileWidth > imageWidth || tileHeight > imageHeight) {
    errors.push('Tile dimensions cannot exceed image dimensions')
  }

  if (spacing < 0 || margin < 0) {
    errors.push('Spacing and margin cannot be negative')
  }

  const usableWidth = imageWidth - 2 * margin
  const usableHeight = imageHeight - 2 * margin
  const columns = Math.floor((usableWidth + spacing) / (tileWidth + spacing))
  const rows = Math.floor((usableHeight + spacing) / (tileHeight + spacing))

  if (columns < 1 || rows < 1) {
    errors.push('Configuration does not produce any complete tiles')
  }

  if (columns >= 1) {
    const usedWidth = columns * (tileWidth + spacing) - spacing
    const leftoverWidth = usableWidth - usedWidth
    if (leftoverWidth > 0) {
      warnings.push('Tiles do not evenly cover the image width. Some pixels at the edges will be ignored.')
    }
  }

  if (rows >= 1) {
    const usedHeight = rows * (tileHeight + spacing) - spacing
    const leftoverHeight = usableHeight - usedHeight
    if (leftoverHeight > 0) {
      warnings.push('Tiles do not evenly cover the image height. Some pixels at the edges will be ignored.')
    }
  }

  if (tileWidth % 8 !== 0 || tileHeight % 8 !== 0) {
    warnings.push('Tile dimensions are not multiples of 8px. Consider snapping to an 8px grid for retro/pixel art workflows.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

