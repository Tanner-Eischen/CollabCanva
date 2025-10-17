/**
 * Asset Analyzer
 * 
 * Performs intelligent analysis of tileset images to detect:
 * - Themes (forest, dungeon, desert, etc.)
 * - Materials (grass, stone, water, etc.)
 * - Auto-tile systems (blob16, blob47, etc.)
 * - Named tiles (for Kenney assets)
 * - Seamless tiling validation
 */

import { TilesetMetadata } from '../../types/asset'
import {
  detectKenneyTileset,
  generateKenneyMetadata,
  detectMaterialFromName,
  detectThemeFromName
} from './kenneyTileNamer'

/**
 * Color utilities
 */
interface RGB {
  r: number
  g: number
  b: number
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  
  if (delta === 0) return 0
  
  let hue: number
  if (max === r) {
    hue = ((g - b) / delta) % 6
  } else if (max === g) {
    hue = (b - r) / delta + 2
  } else {
    hue = (r - g) / delta + 4
  }
  
  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360
  
  return hue
}

function rgbToSaturation(r: number, g: number, b: number): number {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  
  if (max === 0) return 0
  
  return (max - min) / max
}

function rgbToLightness(r: number, g: number, b: number): number {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  
  return (max + min) / 2
}

/**
 * Color histogram for dominant color detection
 */
interface ColorHistogram {
  hueHistogram: number[] // 36 bins (10° each)
  saturationHistogram: number[] // 10 bins
  lightnessHistogram: number[] // 10 bins
  dominantColors: RGB[]
}

function analyzeColors(imageData: ImageData): ColorHistogram {
  const hueHist = new Array(36).fill(0)
  const satHist = new Array(10).fill(0)
  const lightHist = new Array(10).fill(0)
  const colorSamples: RGB[] = []
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < imageData.data.length; i += 16) {
    const r = imageData.data[i]
    const g = imageData.data[i + 1]
    const b = imageData.data[i + 2]
    const a = imageData.data[i + 3]
    
    // Skip transparent pixels
    if (a < 128) continue
    
    const hue = rgbToHue(r, g, b)
    const sat = rgbToSaturation(r, g, b)
    const light = rgbToLightness(r, g, b)
    
    hueHist[Math.floor(hue / 10)]++
    satHist[Math.min(Math.floor(sat * 10), 9)]++
    lightHist[Math.min(Math.floor(light * 10), 9)]++
    
    colorSamples.push({ r, g, b })
  }
  
  // Get dominant colors (top 5)
  const dominantColors = colorSamples
    .sort((a, b) => {
      // Sort by frequency in color space
      const aKey = `${Math.floor(a.r / 32)}-${Math.floor(a.g / 32)}-${Math.floor(a.b / 32)}`
      const bKey = `${Math.floor(b.r / 32)}-${Math.floor(b.g / 32)}-${Math.floor(b.b / 32)}`
      return aKey.localeCompare(bKey)
    })
    .slice(0, 5)
  
  return {
    hueHistogram: hueHist,
    saturationHistogram: satHist,
    lightnessHistogram: lightHist,
    dominantColors
  }
}

/**
 * Detect theme based on color analysis
 */
function detectThemeFromColors(histogram: ColorHistogram): Array<{ theme: string; confidence: number }> {
  const themes: Array<{ theme: string; confidence: number }> = []
  
  // Green dominant → forest
  const greenHue = histogram.hueHistogram.slice(9, 15).reduce((sum, val) => sum + val, 0) // 90-150°
  const totalHue = histogram.hueHistogram.reduce((sum, val) => sum + val, 0)
  if (greenHue / totalHue > 0.3) {
    themes.push({ theme: 'forest', confidence: Math.min(greenHue / totalHue, 0.95) })
  }
  
  // Gray dominant + low saturation → dungeon/stone
  const avgSat = histogram.saturationHistogram.reduce((sum, val, i) => sum + val * i, 0) / totalHue / 10
  const avgLight = histogram.lightnessHistogram.reduce((sum, val, i) => sum + val * i, 0) / totalHue / 10
  if (avgSat < 0.3 && avgLight > 0.3 && avgLight < 0.7) {
    themes.push({ theme: 'dungeon', confidence: 0.7 })
  }
  
  // Blue dominant → water/ice/snow
  const blueHue = histogram.hueHistogram.slice(18, 24).reduce((sum, val) => sum + val, 0) // 180-240°
  if (blueHue / totalHue > 0.3) {
    const isIce = avgLight > 0.7
    themes.push({ theme: isIce ? 'snow' : 'water', confidence: Math.min(blueHue / totalHue, 0.9) })
  }
  
  // Yellow/orange dominant → desert
  const yellowHue = histogram.hueHistogram.slice(4, 9).reduce((sum, val) => sum + val, 0) // 40-90°
  if (yellowHue / totalHue > 0.35) {
    themes.push({ theme: 'desert', confidence: Math.min(yellowHue / totalHue, 0.85) })
  }
  
  // Red/orange dominant → lava/fire
  const redHue = histogram.hueHistogram.slice(0, 4).reduce((sum, val) => sum + val, 0) // 0-40°
  if (redHue / totalHue > 0.3 && avgLight < 0.5) {
    themes.push({ theme: 'lava', confidence: Math.min(redHue / totalHue, 0.8) })
  }
  
  // High lightness + low saturation → snow
  if (avgLight > 0.8 && avgSat < 0.2) {
    themes.push({ theme: 'snow', confidence: 0.75 })
  }
  
  // Sort by confidence
  return themes.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Detect materials based on color analysis
 */
function detectMaterialsFromColors(histogram: ColorHistogram): string[] {
  const materials: string[] = []
  const totalHue = histogram.hueHistogram.reduce((sum, val) => sum + val, 0)
  const avgSat = histogram.saturationHistogram.reduce((sum, val, i) => sum + val * i, 0) / totalHue / 10
  const avgLight = histogram.lightnessHistogram.reduce((sum, val, i) => sum + val * i, 0) / totalHue / 10
  
  // Green → grass
  const greenHue = histogram.hueHistogram.slice(9, 15).reduce((sum, val) => sum + val, 0)
  if (greenHue / totalHue > 0.2) {
    materials.push('grass')
  }
  
  // Brown → dirt
  const brownHue = histogram.hueHistogram.slice(2, 5).reduce((sum, val) => sum + val, 0)
  if (brownHue / totalHue > 0.15 && avgSat < 0.5) {
    materials.push('dirt')
  }
  
  // Blue → water
  const blueHue = histogram.hueHistogram.slice(18, 24).reduce((sum, val) => sum + val, 0)
  if (blueHue / totalHue > 0.2) {
    materials.push('water')
  }
  
  // Gray → stone
  if (avgSat < 0.2 && avgLight > 0.3 && avgLight < 0.7) {
    materials.push('stone')
  }
  
  // Yellow → sand
  const yellowHue = histogram.hueHistogram.slice(4, 9).reduce((sum, val) => sum + val, 0)
  if (yellowHue / totalHue > 0.25) {
    materials.push('sand')
  }
  
  // Light + low sat → snow
  if (avgLight > 0.7 && avgSat < 0.2) {
    materials.push('snow')
  }
  
  // Dark + saturated → lava
  if (avgLight < 0.4 && avgSat > 0.6) {
    materials.push('lava')
  }
  
  return materials
}

/**
 * Detect auto-tile system based on tile count and pattern
 */
function detectAutoTileSystem(
  tileCount: number,
  tileWidth: number,
  tileHeight: number
): {
  system: 'blob16' | 'blob47' | 'wang' | 'custom' | null
  confidence: number
} {
  // Blob-16 (most common)
  if (tileCount === 16) {
    return { system: 'blob16', confidence: 0.95 }
  }
  
  // Blob-47
  if (tileCount === 47 || tileCount === 48) {
    return { system: 'blob47', confidence: 0.9 }
  }
  
  // Wang tiles (usually multiples of 16)
  if (tileCount % 16 === 0 && tileCount > 16 && tileCount <= 256) {
    return { system: 'wang', confidence: 0.6 }
  }
  
  // Custom (anything else with reasonable tile count)
  if (tileCount > 1 && tileCount < 1000) {
    return { system: 'custom', confidence: 0.4 }
  }
  
  return { system: null, confidence: 0 }
}

/**
 * Validate seamless tiling (check edges)
 */
function validateSeamlessTiling(
  imageData: ImageData,
  tileWidth: number,
  tileHeight: number,
  columns: number
): {
  quality: 'good' | 'issues' | 'unchecked'
  warnings: string[]
} {
  const warnings: string[] = []
  
  // Check if we have at least one complete tile
  if (imageData.width < tileWidth || imageData.height < tileHeight) {
    return { quality: 'unchecked', warnings: ['Image too small to validate'] }
  }
  
  // Sample first tile's edges
  const getPixel = (x: number, y: number): RGB => {
    const idx = (y * imageData.width + x) * 4
    return {
      r: imageData.data[idx],
      g: imageData.data[idx + 1],
      b: imageData.data[idx + 2]
    }
  }
  
  const colorDiff = (a: RGB, b: RGB): number => {
    return Math.sqrt(
      Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
    )
  }
  
  // Check first tile (0, 0)
  let hasSeamIssues = false
  
  // Check top vs bottom edge
  for (let x = 0; x < tileWidth && x < imageData.width; x++) {
    const topPixel = getPixel(x, 0)
    const bottomPixel = getPixel(x, Math.min(tileHeight - 1, imageData.height - 1))
    
    if (colorDiff(topPixel, bottomPixel) > 50) {
      hasSeamIssues = true
      break
    }
  }
  
  // Check left vs right edge
  for (let y = 0; y < tileHeight && y < imageData.height; y++) {
    const leftPixel = getPixel(0, y)
    const rightPixel = getPixel(Math.min(tileWidth - 1, imageData.width - 1), y)
    
    if (colorDiff(leftPixel, rightPixel) > 50) {
      hasSeamIssues = true
      break
    }
  }
  
  if (hasSeamIssues) {
    warnings.push('Tiles may not seamlessly connect - edges have visible differences')
    return { quality: 'issues', warnings }
  }
  
  return { quality: 'good', warnings: [] }
}

/**
 * Analyze tileset image and generate enhanced metadata
 */
export async function analyzeTileset(
  imageData: ImageData,
  assetName: string,
  baseMeta: Pick<TilesetMetadata, 'tileWidth' | 'tileHeight' | 'columns' | 'rows' | 'tileCount'>
): Promise<Partial<TilesetMetadata>> {
  console.log(`[AssetAnalyzer] Analyzing tileset: ${assetName}`)
  
  // Start with base metadata
  const metadata: Partial<TilesetMetadata> = {
    version: 1,
    pixelArt: true, // assume pixel art for game tilesets
  }
  
  // Check if this is a Kenney tileset
  const isKenney = detectKenneyTileset(assetName)
  
  if (isKenney) {
    console.log('[AssetAnalyzer] Detected Kenney tileset')
    const kenneyMeta = generateKenneyMetadata(
      assetName,
      baseMeta.tileCount,
      baseMeta.tileWidth,
      baseMeta.tileHeight
    )
    
    Object.assign(metadata, kenneyMeta)
    
    // Set high confidence for Kenney detection
    metadata.detectionConfidence = {
      autoTilePattern: kenneyMeta.autoTileSystem ? 0.95 : 0.5,
      namedTiles: 0.9,
      overall: 0.9
    }
  } else {
    // Perform visual analysis for non-Kenney assets
    console.log('[AssetAnalyzer] Performing color analysis')
    const colorHist = analyzeColors(imageData)
    
    // Detect themes
    const detectedThemes = detectThemeFromColors(colorHist)
    const themeNames = detectedThemes
      .filter(t => t.confidence > 0.5)
      .map(t => t.theme)
    
    // Also check name-based themes
    const nameThemes = detectThemeFromName(assetName)
    const combinedThemes = Array.from(new Set([...themeNames, ...nameThemes]))
    
    if (combinedThemes.length > 0) {
      metadata.themes = combinedThemes
    }
    
    // Detect materials
    const colorMaterials = detectMaterialsFromColors(colorHist)
    const nameMaterial = detectMaterialFromName(assetName)
    const combinedMaterials = Array.from(new Set([
      ...colorMaterials,
      ...(nameMaterial ? [nameMaterial] : [])
    ]))
    
    if (combinedMaterials.length > 0) {
      metadata.materials = combinedMaterials
    }
    
    // Detect auto-tile system
    const autoTileDetection = detectAutoTileSystem(
      baseMeta.tileCount,
      baseMeta.tileWidth,
      baseMeta.tileHeight
    )
    
    if (autoTileDetection.system) {
      metadata.autoTileSystem = autoTileDetection.system
      metadata.features = {
        autotile: autoTileDetection.confidence > 0.7
      }
    }
    
    // Generate basic named tiles if auto-tile system detected
    if (autoTileDetection.system && autoTileDetection.confidence > 0.6) {
      const material = metadata.materials?.[0] || 'tile'
      metadata.namedTiles = {}
      
      for (let i = 0; i < baseMeta.tileCount; i++) {
        metadata.namedTiles[`${material}.tile_${i}`] = i
      }
    }
    
    // Set detection confidence
    metadata.detectionConfidence = {
      autoTilePattern: autoTileDetection.confidence,
      namedTiles: metadata.namedTiles ? 0.6 : 0.2,
      overall: detectedThemes.length > 0 ? detectedThemes[0].confidence : 0.5
    }
  }
  
  // Detect layer types (works for both Kenney and custom)
  if (!metadata.layerTypes || metadata.layerTypes.length === 0) {
    const layerTypes: Array<'background' | 'ground' | 'props' | 'fx' | 'decals' | 'collision'> = []
    
    if (baseMeta.tileCount === 16 || baseMeta.tileCount === 47 || baseMeta.tileCount === 48) {
      layerTypes.push('ground', 'background')
    } else {
      layerTypes.push('ground')
    }
    
    metadata.layerTypes = layerTypes
  }
  
  // Validate seamless tiling
  console.log('[AssetAnalyzer] Validating seamless tiling')
  const seamValidation = validateSeamlessTiling(
    imageData,
    baseMeta.tileWidth,
    baseMeta.tileHeight,
    baseMeta.columns
  )
  
  metadata.validation = {
    seamQuality: seamValidation.quality,
    dimensionCheck: 'pass',
    warnings: seamValidation.warnings,
    checkedAt: Date.now()
  }
  
  // Compute tileSize if square tiles
  if (baseMeta.tileWidth === baseMeta.tileHeight) {
    metadata.tileSize = baseMeta.tileWidth
  }
  
  console.log('[AssetAnalyzer] Analysis complete', metadata)
  
  return metadata
}

/**
 * Load image from URL and get ImageData
 */
export async function loadImageData(imageUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      resolve(imageData)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = imageUrl
  })
}

/**
 * Analyze image from URL
 */
export async function analyzeImageFromUrl(
  imageUrl: string,
  assetName: string,
  baseMeta: Pick<TilesetMetadata, 'tileWidth' | 'tileHeight' | 'columns' | 'rows' | 'tileCount'>
): Promise<Partial<TilesetMetadata>> {
  const imageData = await loadImageData(imageUrl)
  return analyzeTileset(imageData, assetName, baseMeta)
}

