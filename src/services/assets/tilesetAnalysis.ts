/**
 * Tileset Analysis Service
 * Automatically detects auto-tile patterns and generates named tile indices
 */

import type { TilesetMetadata } from '../../types/asset'

/**
 * Analysis result from pattern detection
 */
export interface TilesetAnalysisResult {
  autoTileSystem?: 'blob16' | 'blob47' | 'wang'
  namedTiles: Record<string, number>
  features: {
    autotile: boolean
    props: boolean
    decals: boolean
    animated: boolean
  }
  detectionConfidence: {
    autoTilePattern: number
    namedTiles: number
    overall: number
  }
  warnings: string[]
}

/**
 * Analyze tileset and generate metadata
 */
export async function analyzeTileset(
  imageUrl: string,
  baseMetadata: Pick<TilesetMetadata, 'tileWidth' | 'tileHeight' | 'columns' | 'rows' | 'spacing' | 'margin'>
): Promise<TilesetAnalysisResult> {
  console.log('🔬 [ANALYZER] Starting tileset analysis...')
  console.log('🔬 [ANALYZER] Base metadata:', baseMetadata)
  
  // Load image
  console.log('🔬 [ANALYZER] Slicing tileset image...')
  const tiles = await sliceTilesetImage(imageUrl, baseMetadata)
  console.log(`🔬 [ANALYZER] Sliced ${tiles.length} tiles`)
  
  // Try pattern detection (template matching)
  console.log('🔬 [ANALYZER] Detecting patterns...')
  const blob16 = detectBlob16Pattern(tiles, baseMetadata)
  console.log(`🔬 [ANALYZER] Blob16 confidence: ${blob16.confidence.toFixed(3)}`, blob16)
  
  const blob47 = detectBlob47Pattern(tiles, baseMetadata)
  console.log(`🔬 [ANALYZER] Blob47 confidence: ${blob47.confidence.toFixed(3)}`, blob47)
  
  const wang = detectWangPattern(tiles, baseMetadata)
  console.log(`🔬 [ANALYZER] Wang confidence: ${wang.confidence.toFixed(3)}`, wang)
  
  // Pick best match
  const patterns = [
    { type: 'blob16' as const, result: blob16 },
    { type: 'blob47' as const, result: blob47 },
    { type: 'wang' as const, result: wang }
  ].sort((a, b) => b.result.confidence - a.result.confidence)
  
  const bestPattern = patterns[0]
  console.log(`🔬 [ANALYZER] Best pattern: ${bestPattern.type} (confidence: ${bestPattern.result.confidence.toFixed(3)})`)
  
  // Detect props (isolated, non-grid sprites)
  const props = detectProps(tiles, baseMetadata)
  
  // Detect decals (semi-transparent tiles)
  const decals = detectDecals(tiles)
  
  // Detect animation frames (similar tiles in sequence)
  const animated = detectAnimationFrames(tiles, baseMetadata)
  
  // Build named tiles index
  const namedTiles: Record<string, number> = {}
  
  // Add auto-tile names if detected
  if (bestPattern.result.confidence > 0.6) {
    console.log(`🔬 [ANALYZER] Adding auto-tile names (confidence > 0.6)`)
    console.log(`🔬 [ANALYZER] Auto-tile named tiles:`, bestPattern.result.namedTiles)
    Object.assign(namedTiles, bestPattern.result.namedTiles)
  } else {
    console.log(`🔬 [ANALYZER] ⚠️ Confidence too low (${bestPattern.result.confidence.toFixed(3)} < 0.6) - skipping auto-tile names`)
  }
  
  // Add prop names
  console.log(`🔬 [ANALYZER] Detected ${props.length} props`)
  props.forEach((prop, idx) => {
    namedTiles[`prop.${idx}`] = prop.tileIndex
  })
  
  // Add decal names
  console.log(`🔬 [ANALYZER] Detected ${decals.length} decals`)
  decals.forEach((decal, idx) => {
    namedTiles[`decal.${idx}`] = decal.tileIndex
  })
  
  console.log(`🔬 [ANALYZER] Total named tiles: ${Object.keys(namedTiles).length}`)
  if (Object.keys(namedTiles).length > 0) {
    console.log(`🔬 [ANALYZER] Sample named tiles:`, Object.entries(namedTiles).slice(0, 10))
  }
  
  // Calculate overall confidence
  const namedTileConfidence = Object.keys(namedTiles).length > 0 ? 0.7 : 0.3
  const overallConfidence = (bestPattern.result.confidence + namedTileConfidence) / 2
  
  const result = {
    autoTileSystem: bestPattern.result.confidence > 0.6 ? bestPattern.type : undefined,
    namedTiles,
    features: {
      autotile: bestPattern.result.confidence > 0.6,
      props: props.length > 0,
      decals: decals.length > 0,
      animated: animated.length > 0
    },
    detectionConfidence: {
      autoTilePattern: bestPattern.result.confidence,
      namedTiles: namedTileConfidence,
      overall: overallConfidence
    },
    warnings: [
      ...(bestPattern.result.confidence < 0.6 ? ['Auto-tile pattern detection uncertain'] : []),
      ...(Object.keys(namedTiles).length === 0 ? ['No named tiles detected'] : [])
    ]
  }
  
  console.log('🔬 [ANALYZER] ✅ Analysis complete. Result:', result)
  
  return result
}

/**
 * Slice tileset image into individual tiles
 */
async function sliceTilesetImage(
  imageUrl: string,
  metadata: Pick<TilesetMetadata, 'tileWidth' | 'tileHeight' | 'columns' | 'rows' | 'spacing' | 'margin'>
): Promise<ImageData[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      const tiles: ImageData[] = []
      const { tileWidth, tileHeight, columns, rows, spacing = 0, margin = 0 } = metadata
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const x = margin + col * (tileWidth + spacing)
          const y = margin + row * (tileHeight + spacing)
          
          canvas.width = tileWidth
          canvas.height = tileHeight
          ctx.clearRect(0, 0, tileWidth, tileHeight)
          ctx.drawImage(img, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)
          
          tiles.push(ctx.getImageData(0, 0, tileWidth, tileHeight))
        }
      }
      
      resolve(tiles)
    }
    
    img.onerror = () => reject(new Error('Failed to load tileset image'))
    img.src = imageUrl
  })
}

/**
 * Detect blob16 (4-neighbor) auto-tile pattern
 */
function detectBlob16Pattern(
  tiles: ImageData[],
  metadata: Pick<TilesetMetadata, 'columns' | 'rows'>
): { confidence: number; namedTiles: Record<string, number> } {
  // Blob16 typically appears as a 4x4 grid (16 tiles)
  const { columns, rows } = metadata
  
  // Look for 4x4 regions with the characteristic pattern
  let bestMatch = { confidence: 0, startIndex: 0 }
  
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 0; col <= columns - 4; col++) {
      const startIdx = row * columns + col
      const confidence = checkBlob16Pattern(tiles, startIdx, columns)
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { confidence, startIndex: startIdx }
      }
    }
  }
  
  if (bestMatch.confidence < 0.3) {
    return { confidence: 0, namedTiles: {} }
  }
  
  // Generate standard blob16 names
  const namedTiles: Record<string, number> = {
    'center': bestMatch.startIndex + 15,      // 1111 - all neighbors
    'island': bestMatch.startIndex + 0,       // 0000 - no neighbors
    'edge.north': bestMatch.startIndex + 8,   // 1000
    'edge.south': bestMatch.startIndex + 2,   // 0010
    'edge.east': bestMatch.startIndex + 4,    // 0100
    'edge.west': bestMatch.startIndex + 1,    // 0001
    'corner.ne': bestMatch.startIndex + 12,   // 1100
    'corner.nw': bestMatch.startIndex + 9,    // 1001
    'corner.se': bestMatch.startIndex + 6,    // 0110
    'corner.sw': bestMatch.startIndex + 3,    // 0011
    'vertical': bestMatch.startIndex + 5,     // 0101 - E+W
    'horizontal': bestMatch.startIndex + 10,  // 1010 - N+S
    't.north': bestMatch.startIndex + 13,     // 1101
    't.south': bestMatch.startIndex + 7,      // 0111
    't.east': bestMatch.startIndex + 14,      // 1110
    't.west': bestMatch.startIndex + 11,      // 1011
  }
  
  return {
    confidence: bestMatch.confidence,
    namedTiles
  }
}

/**
 * Check if a 4x4 tile region matches blob16 pattern
 */
function checkBlob16Pattern(tiles: ImageData[], startIdx: number, columns: number): number {
  // Check if tiles show the characteristic blob pattern
  // This is a heuristic based on edge similarity
  
  let score = 0
  const region: ImageData[] = []
  
  // Extract 4x4 region
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = startIdx + r * columns + c
      if (idx >= tiles.length) return 0
      region.push(tiles[idx])
    }
  }
  
  // Check if corners (0,0) differs from center (15 = 3,3)
  const cornerCenterSimilarity = compareTiles(region[0], region[15])
  if (cornerCenterSimilarity < 0.5) score += 0.3  // Good: island vs center different
  
  // Check if edges show gradual transitions
  const edgeSimilarity = (
    compareTiles(region[1], region[2]) +
    compareTiles(region[4], region[8])
  ) / 2
  if (edgeSimilarity > 0.6) score += 0.3  // Good: edges similar to each other
  
  // Check if center region is consistent
  const centerConsistency = (
    compareTiles(region[10], region[11]) +
    compareTiles(region[14], region[15])
  ) / 2
  if (centerConsistency > 0.8) score += 0.4  // Good: center tiles very similar
  
  return Math.min(score, 1.0)
}

/**
 * Detect blob47 (8-neighbor) auto-tile pattern
 */
function detectBlob47Pattern(
  tiles: ImageData[],
  metadata: Pick<TilesetMetadata, 'columns' | 'rows'>
): { confidence: number; namedTiles: Record<string, number> } {
  // Blob47 is more complex, typically arranged in specific layouts
  // For now, return low confidence (implement if needed)
  return { confidence: 0, namedTiles: {} }
}

/**
 * Detect Wang tile pattern
 */
function detectWangPattern(
  tiles: ImageData[],
  metadata: Pick<TilesetMetadata, 'columns' | 'rows'>
): { confidence: number; namedTiles: Record<string, number> } {
  // Wang tiles have specific edge color patterns
  // For now, return low confidence (implement if needed)
  return { confidence: 0, namedTiles: {} }
}

/**
 * Detect standalone props (trees, rocks, etc.)
 */
function detectProps(
  tiles: ImageData[],
  metadata: Pick<TilesetMetadata, 'columns' | 'rows'>
): Array<{ tileIndex: number; type: string }> {
  const props: Array<{ tileIndex: number; type: string }> = []
  
  tiles.forEach((tile, idx) => {
    // Check if tile has significant transparency (likely a prop)
    const alphaRatio = calculateAlphaRatio(tile)
    
    // Check if tile has content concentrated in center (not edge-to-edge)
    const centerConcentration = calculateCenterConcentration(tile)
    
    if (alphaRatio > 0.3 && centerConcentration > 0.6) {
      props.push({ tileIndex: idx, type: 'prop' })
    }
  })
  
  return props
}

/**
 * Detect decal tiles (semi-transparent overlays)
 */
function detectDecals(tiles: ImageData[]): Array<{ tileIndex: number }> {
  const decals: Array<{ tileIndex: number }> = []
  
  tiles.forEach((tile, idx) => {
    const alphaRatio = calculateAlphaRatio(tile)
    const avgAlpha = calculateAverageAlpha(tile)
    
    // Decals have moderate alpha (not fully opaque or transparent)
    if (alphaRatio > 0.5 && avgAlpha > 0.3 && avgAlpha < 0.9) {
      decals.push({ tileIndex: idx })
    }
  })
  
  return decals
}

/**
 * Detect animation frames (similar consecutive tiles)
 */
function detectAnimationFrames(
  tiles: ImageData[],
  metadata: Pick<TilesetMetadata, 'columns'>
): Array<{ startIndex: number; frameCount: number }> {
  const animations: Array<{ startIndex: number; frameCount: number }> = []
  
  // Look for sequences of similar tiles (typically in rows)
  for (let i = 0; i < tiles.length - 1; i++) {
    const similarity = compareTiles(tiles[i], tiles[i + 1])
    
    if (similarity > 0.7 && similarity < 0.99) {
      // Found potential animation start
      let frameCount = 2
      let j = i + 2
      
      while (j < tiles.length && compareTiles(tiles[i], tiles[j]) > 0.6) {
        frameCount++
        j++
      }
      
      if (frameCount >= 2 && frameCount <= 8) {
        animations.push({ startIndex: i, frameCount })
        i = j - 1  // Skip past this animation
      }
    }
  }
  
  return animations
}

/**
 * Compare two tiles and return similarity score (0-1)
 */
function compareTiles(tile1: ImageData, tile2: ImageData): number {
  if (tile1.width !== tile2.width || tile1.height !== tile2.height) {
    return 0
  }
  
  let totalDiff = 0
  const pixelCount = tile1.width * tile1.height
  
  for (let i = 0; i < tile1.data.length; i += 4) {
    const rDiff = Math.abs(tile1.data[i] - tile2.data[i])
    const gDiff = Math.abs(tile1.data[i + 1] - tile2.data[i + 1])
    const bDiff = Math.abs(tile1.data[i + 2] - tile2.data[i + 2])
    const aDiff = Math.abs(tile1.data[i + 3] - tile2.data[i + 3])
    
    totalDiff += (rDiff + gDiff + bDiff + aDiff) / (255 * 4)
  }
  
  return 1 - (totalDiff / pixelCount)
}

/**
 * Calculate ratio of transparent pixels
 */
function calculateAlphaRatio(tile: ImageData): number {
  let transparentPixels = 0
  const totalPixels = tile.width * tile.height
  
  for (let i = 3; i < tile.data.length; i += 4) {
    if (tile.data[i] < 10) {  // Nearly transparent
      transparentPixels++
    }
  }
  
  return transparentPixels / totalPixels
}

/**
 * Calculate average alpha value
 */
function calculateAverageAlpha(tile: ImageData): number {
  let totalAlpha = 0
  const pixelCount = tile.width * tile.height
  
  for (let i = 3; i < tile.data.length; i += 4) {
    totalAlpha += tile.data[i] / 255
  }
  
  return totalAlpha / pixelCount
}

/**
 * Calculate how concentrated content is in the center
 */
function calculateCenterConcentration(tile: ImageData): number {
  const { width, height } = tile
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 3
  
  let centerPixels = 0
  let centerOpaquePixels = 0
  let edgePixels = 0
  let edgeOpaquePixels = 0
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const alpha = tile.data[idx + 3]
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
      
      if (distance < radius) {
        centerPixels++
        if (alpha > 128) centerOpaquePixels++
      } else {
        edgePixels++
        if (alpha > 128) edgeOpaquePixels++
      }
    }
  }
  
  const centerDensity = centerOpaquePixels / centerPixels
  const edgeDensity = edgeOpaquePixels / edgePixels
  
  return centerDensity / (centerDensity + edgeDensity + 0.001)  // Avoid division by zero
}

/**
 * Generate basic numeric index as fallback
 */
export function generateBasicIndex(metadata: Pick<TilesetMetadata, 'tileCount'>): Record<string, number> {
  console.log(`🔬 [ANALYZER] Generating basic index for ${metadata.tileCount} tiles (fallback mode)`)
  const index: Record<string, number> = {}
  
  for (let i = 0; i < metadata.tileCount; i++) {
    index[`tile.${i}`] = i
  }
  
  console.log(`🔬 [ANALYZER] Basic index created with ${Object.keys(index).length} entries`)
  
  return index
}

