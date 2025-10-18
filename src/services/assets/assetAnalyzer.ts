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

import type { TilesetMetadata } from '../../types/asset'
import {
  detectKenneyTileset,
  generateKenneyMetadata,
  detectMaterialFromName,
  detectThemeFromName
} from './kenneyTileNamer'
import {
  analyzeImageColors,
  clampPalette,
  suggestMaterialsFromColors,
  suggestThemesFromColors,
  type RGB
} from '../../utils/colorAnalysis'

/**
 * Detect auto-tile system based on tile count and pattern
 */
function detectAutoTileSystem(
  tileCount: number,
  _tileWidth: number,
  _tileHeight: number
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
  tileHeight: number
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
  console.info(`[AssetAnalyzer] Analyzing tileset: ${assetName}`)
  
  // Start with base metadata
  const metadata: Partial<TilesetMetadata> = {
    version: 1,
    pixelArt: true, // assume pixel art for game tilesets
  }
  
  // Check if this is a Kenney tileset
  const isKenney = detectKenneyTileset(assetName)
  
  if (isKenney) {
    console.info('[AssetAnalyzer] Detected Kenney tileset')
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
    console.info('[AssetAnalyzer] Performing color analysis')
    const colorAnalysis = analyzeImageColors(imageData, { sampleStep: 4, maxColors: 8 })
    const palette = clampPalette(colorAnalysis.dominant)

    if (palette.length > 0) {
      metadata.palette = palette
    }

    // Detect themes
    const detectedThemes = suggestThemesFromColors(colorAnalysis)
    const themeNames = detectedThemes
      .filter(t => t.confidence > 0.45)
      .map(t => t.theme)
    
    // Also check name-based themes
    const nameThemes = detectThemeFromName(assetName)
    const combinedThemes = Array.from(new Set([...themeNames, ...nameThemes]))
    
    if (combinedThemes.length > 0) {
      metadata.themes = combinedThemes
    }
    
    // Detect materials
    const colorMaterials = suggestMaterialsFromColors(colorAnalysis)
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
  console.info('[AssetAnalyzer] Validating seamless tiling')
  const seamValidation = validateSeamlessTiling(
    imageData,
    baseMeta.tileWidth,
    baseMeta.tileHeight
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
  
  console.info('[AssetAnalyzer] Analysis complete', metadata)
  
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

