/**
 * Asset Upload Service (PR-31)
 * Handles uploading, storing, and managing game assets (sprite sheets, tilesets, etc.)
 */

import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { ref as dbRef, set, get, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { storage, db } from '../firebase'
import { analyzeTileset as analyzePatterns, generateBasicIndex, type TilesetAnalysisResult } from './tilesetAnalysis'
import { updateCatalogEntry, removeCatalogEntry } from './assetCatalog'
import { analyzeImageFromUrl as analyzeThemesAndMaterials } from './assetAnalyzer'
import type {
  Asset,
  AssetType,
  AssetMetadata,
  AssetValidation,
  AssetUploadProgress,
  TilesetMetadata,
  SpriteSheetMetadata,
  SpriteSelection,
  TileSemanticGroup
} from '../../types/asset'

/**
 * Maximum file size for uploads (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Allowed MIME types for assets
 */
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif'
]

/**
 * Generate unique asset ID
 */
function generateAssetId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate file before upload
 */
export function validateAssetFile(file: File): AssetValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported. Allowed types: PNG, JPG, WEBP, GIF`)
  }

  // Warning for large files
  if (file.size > 5 * 1024 * 1024) {
    warnings.push('Large files may take longer to load in your canvases')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Extract image metadata from file
 */
export async function extractImageMetadata(file: File): Promise<AssetMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.width,
        height: img.height,
        fileSize: file.size,
        mimeType: file.type
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Generate thumbnail from image file
 */
export async function generateThumbnail(file: File, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Create canvas for thumbnail
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Calculate thumbnail size maintaining aspect ratio
      const scale = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      // Draw and export
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for thumbnail'))
    }

    img.src = url
  })
}

/**
 * Upload asset to Firebase Storage
 */
export async function uploadAsset(
  file: File,
  userId: string,
  options: {
    name?: string
    type?: AssetType
    tags?: string[]
    folderId?: string
    tilesetMetadata?: TilesetMetadata
    spriteSheetMetadata?: SpriteSheetMetadata
    onProgress?: (progress: AssetUploadProgress) => void
    
    // NEW: Analysis options
    autoAnalyze?: boolean        // default: true for tilesets
    skipPatternDetection?: boolean  // skip if user provided complete metadata
  } = {}
): Promise<Asset> {
  // Validate file
  const validation = validateAssetFile(file)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  const assetId = generateAssetId()
  const fileName = file.name
  const assetName = options.name || fileName.replace(/\.[^/.]+$/, '') // remove extension

  // Extract image metadata
  const metadata = await extractImageMetadata(file)

  // Generate thumbnail
  let thumbnailUrl: string | undefined
  try {
    thumbnailUrl = await generateThumbnail(file)
  } catch (error) {
    console.warn('Failed to generate thumbnail:', error)
  }

  // Upload to Firebase Storage
  const storagePath = `assets/${userId}/${assetId}`
  const fileRef = storageRef(storage, storagePath)

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: fileName,
        assetId: assetId
      }
    })

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        options.onProgress?.({
          assetId,
          fileName,
          progress,
          status: 'uploading'
        })
      },
      (error) => {
        reject(new Error(`Upload failed: ${error.message}`))
      },
      async () => {
        try {
          // Get download URL
          const url = await getDownloadURL(fileRef)

          // Auto-detect asset type if not provided
          const assetType = options.type || detectAssetType(metadata, options)
          
          // === NEW: Auto-analyze tileset ===
          let enrichedTilesetMetadata = options.tilesetMetadata
          
          if (assetType === 'tileset' && enrichedTilesetMetadata) {
            const shouldAnalyze = options.autoAnalyze !== false && !options.skipPatternDetection
            
            if (shouldAnalyze) {
              options.onProgress?.({
                assetId,
                fileName,
                progress: 95,
                status: 'processing'
              })
              
              try {
                // 1. Pattern detection (auto-tile, named tiles)
                const patternAnalysis = await analyzePatterns(url, {
                  tileWidth: enrichedTilesetMetadata.tileWidth,
                  tileHeight: enrichedTilesetMetadata.tileHeight,
                  columns: enrichedTilesetMetadata.columns,
                  rows: enrichedTilesetMetadata.rows,
                  spacing: enrichedTilesetMetadata.spacing,
                  margin: enrichedTilesetMetadata.margin
                })
                
                // 2. Theme and material detection (color-based)
                const themeAnalysis = await analyzeThemesAndMaterials(url, assetName, {
                  tileWidth: enrichedTilesetMetadata.tileWidth,
                  tileHeight: enrichedTilesetMetadata.tileHeight,
                  columns: enrichedTilesetMetadata.columns,
                  rows: enrichedTilesetMetadata.rows,
                  tileCount: enrichedTilesetMetadata.tileCount
                })
                
                console.log('✅ Tileset analysis complete:', {
                  themes: themeAnalysis.themes,
                  materials: themeAnalysis.materials,
                  autoTileSystem: patternAnalysis.autoTileSystem,
                  namedTileCount: Object.keys(patternAnalysis.namedTiles || {}).length,
                  confidence: patternAnalysis.detectionConfidence.overall
                })
                
                // === NEW: Also try Kenney analyzer for better results ===
                console.log('🎮 Checking if this is a Kenney tileset...')
                const { detectKenneyTileset, generateKenneyMetadata } = await import('./kenneyTileNamer')
                const isKenney = detectKenneyTileset(assetName)
                console.log(`🎮 Kenney tileset detected: ${isKenney}`)
                
                if (isKenney) {
                  console.log('🎮 Using Kenney analyzer for better tile naming...')
                  const kenneyMeta = generateKenneyMetadata(
                    assetName,
                    enrichedTilesetMetadata.tileCount,
                    enrichedTilesetMetadata.tileWidth,
                    enrichedTilesetMetadata.tileHeight
                  )
                  
                  console.log('✅ Kenney analysis complete:', {
                    themes: kenneyMeta.themes,
                    materials: kenneyMeta.materials,
                    autoTileSystem: kenneyMeta.autoTileSystem,
                    namedTileCount: Object.keys(kenneyMeta.namedTiles).length
                  })
                  
                  // Use Kenney results instead
                  Object.assign(patternAnalysis, {
                    namedTiles: kenneyMeta.namedTiles,
                    autoTileSystem: kenneyMeta.autoTileSystem
                  })
                }
                // === END NEW ===
                
                // Merge both analysis results
                enrichedTilesetMetadata = {
                  ...enrichedTilesetMetadata,

                  // From theme analysis
                  ...themeAnalysis,
                  
                  // From pattern analysis (may override theme analysis if higher confidence)
                  autoTileSystem: patternAnalysis.autoTileSystem || themeAnalysis.autoTileSystem,
                  namedTiles: patternAnalysis.namedTiles || themeAnalysis.namedTiles || {},
                  features: {
                    ...patternAnalysis.features,
                    ...themeAnalysis.features
                  },
                  
                  // Combined confidence
                  detectionConfidence: {
                    autoTilePattern: Math.max(
                      patternAnalysis.detectionConfidence.autoTilePattern,
                      themeAnalysis.detectionConfidence?.autoTilePattern || 0
                    ),
                    namedTiles: Math.max(
                      patternAnalysis.detectionConfidence.namedTiles,
                      themeAnalysis.detectionConfidence?.namedTiles || 0
                    ),
                    overall: (patternAnalysis.detectionConfidence.overall + (themeAnalysis.detectionConfidence?.overall || 0)) / 2
                  },
                  
                  // Combined validation
                  validation: {
                    ...(themeAnalysis.validation || {}),
                    dimensionCheck: 'pass',
                    warnings: [
                      ...(patternAnalysis.warnings || []),
                      ...(themeAnalysis.validation?.warnings || [])
                    ],
                    checkedAt: Date.now()
                  },
                  
                  // Set version
                  version: 1
                }

                if (enrichedTilesetMetadata.namedTiles && Object.keys(enrichedTilesetMetadata.namedTiles).length > 0) {
                  const groups = buildTileSemanticGroups(
                    enrichedTilesetMetadata.namedTiles,
                    {
                      materials: enrichedTilesetMetadata.materials,
                      themes: enrichedTilesetMetadata.themes,
                      autoTileSystem: enrichedTilesetMetadata.autoTileSystem
                    }
                  )
                  if (Object.keys(groups).length > 0) {
                    enrichedTilesetMetadata.tileGroups = groups
                  }
                }

                console.log('✅ Final tileset metadata:', {
                  themes: enrichedTilesetMetadata.themes,
                  materials: enrichedTilesetMetadata.materials,
                  autoTileSystem: enrichedTilesetMetadata.autoTileSystem,
                  namedTileCount: Object.keys(enrichedTilesetMetadata.namedTiles || {}).length,
                  confidence: enrichedTilesetMetadata.detectionConfidence?.overall
                })
                
                // Apply semantic naming to sprite selections if they exist
                if (options.spriteSheetMetadata?.spriteSelections && enrichedTilesetMetadata.namedTiles) {
                  applySemanticNamingToSprites(
                    options.spriteSheetMetadata.spriteSelections,
                    enrichedTilesetMetadata.namedTiles,
                    assetName
                  )
                }
              } catch (analysisError) {
                console.warn('⚠ Tileset analysis failed, using basic index:', analysisError)
                
                // Fallback to basic index
                enrichedTilesetMetadata = {
                  ...enrichedTilesetMetadata,
                  namedTiles: generateBasicIndex({ tileCount: enrichedTilesetMetadata.tileCount }),
                  detectionConfidence: {
                    autoTilePattern: 0,
                    namedTiles: 0,
                    overall: 0
                  },
                  validation: {
                    dimensionCheck: 'pass',
                    warnings: ['Auto-analysis failed, using basic tile numbering'],
                    checkedAt: Date.now()
                  },
                  version: 1
                }

                const fallbackGroups = buildTileSemanticGroups(
                  enrichedTilesetMetadata.namedTiles,
                  {
                    materials: enrichedTilesetMetadata.materials,
                    themes: enrichedTilesetMetadata.themes,
                    autoTileSystem: enrichedTilesetMetadata.autoTileSystem
                  }
                )
                if (Object.keys(fallbackGroups).length > 0) {
                  enrichedTilesetMetadata.tileGroups = fallbackGroups
                }
              }
            }
          }

          if (
            assetType === 'tileset' &&
            enrichedTilesetMetadata?.namedTiles &&
            !enrichedTilesetMetadata.tileGroups
          ) {
            const groups = buildTileSemanticGroups(
              enrichedTilesetMetadata.namedTiles,
              {
                materials: enrichedTilesetMetadata.materials,
                themes: enrichedTilesetMetadata.themes,
                autoTileSystem: enrichedTilesetMetadata.autoTileSystem
              }
            )
            if (Object.keys(groups).length > 0) {
              enrichedTilesetMetadata.tileGroups = groups
            }
          }

          // === NEW: Auto-analyze sprite sheets ===
          let enrichedSpriteSheetMetadata = options.spriteSheetMetadata
          
          console.log('🔍 [SPRITESHEET] Checking for analysis...')
          console.log(`🔍 [SPRITESHEET] assetType: ${assetType}`)
          console.log(`🔍 [SPRITESHEET] has enrichedSpriteSheetMetadata: ${!!enrichedSpriteSheetMetadata}`)
          console.log(`🔍 [SPRITESHEET] spriteSelections: ${enrichedSpriteSheetMetadata?.spriteSelections?.length || 0}`)
          
          if (assetType === 'spritesheet' && enrichedSpriteSheetMetadata?.spriteSelections) {
            console.log('🔍 [SPRITESHEET] ✅ Conditions met! Starting analysis...')
            const shouldAnalyze = options.autoAnalyze !== false
            console.log(`🔍 [SPRITESHEET] shouldAnalyze: ${shouldAnalyze}`)
            console.log(`🔍 [SPRITESHEET] spriteSelections.length: ${enrichedSpriteSheetMetadata.spriteSelections.length}`)
            
            if (shouldAnalyze && enrichedSpriteSheetMetadata.spriteSelections.length > 0) {
              console.log('🔍 [SPRITESHEET] ✅ Entering analysis block...')
              options.onProgress?.({
                assetId,
                fileName,
                progress: 95,
                status: 'processing'
              })
              
              try {
                console.log('🔍 [SPRITESHEET] Starting sprite sheet analysis...')
                
                // Get first sprite dimensions for analysis
                const firstSprite = enrichedSpriteSheetMetadata.spriteSelections[0]
                const tileWidth = firstSprite.width
                const tileHeight = firstSprite.height
                
                // Calculate effective grid dimensions
                const cols = enrichedSpriteSheetMetadata.columns || 
                            Math.ceil(Math.sqrt(enrichedSpriteSheetMetadata.spriteSelections.length))
                const rows = enrichedSpriteSheetMetadata.rows || 
                            Math.ceil(enrichedSpriteSheetMetadata.spriteSelections.length / cols)
                
                console.log(`📐 Analyzing as ${cols}x${rows} grid with ${tileWidth}x${tileHeight}px tiles`)
                
                // Check if this is a Kenney tileset first
                const { detectKenneyTileset, generateKenneyMetadata } = await import('./kenneyTileNamer')
                const isKenney = detectKenneyTileset(assetName)
                console.log(`🎮 Kenney tileset detected: ${isKenney}`)
                
                let namedTiles: Record<string, number | string> = {}
                let detectedMaterials: string[] = []
                let detectedThemes: string[] = []
                let autoTileSystem: string | undefined
                
                if (isKenney) {
                  // Use Kenney-specific naming (more aggressive and accurate)
                  console.log('🎮 Using Kenney-specific analyzer...')
                  const kenneyMeta = generateKenneyMetadata(
                    assetName,
                    enrichedSpriteSheetMetadata.spriteSelections.length,
                    tileWidth,
                    tileHeight
                  )
                  namedTiles = kenneyMeta.namedTiles
                  detectedMaterials = kenneyMeta.materials
                  detectedThemes = kenneyMeta.themes
                  autoTileSystem = kenneyMeta.autoTileSystem
                  
                  console.log('✅ Kenney analysis complete:', {
                    themes: detectedThemes,
                    materials: detectedMaterials,
                    autoTileSystem,
                    namedTileCount: Object.keys(namedTiles).length
                  })
                } else {
                  // For sprite sheets with manual selections, skip pattern analysis
                  // (it requires loading image which can have CORS issues)
                  // Instead, just use basic naming
                  console.log('ℹ️ Skipping pattern analysis for manual sprite selections')
                  console.log('✅ Using basic naming for sprite sheet')
                  
                  // Detect sprite type from filename
                  const { detectSpriteType, generateNamedTilesWithType } = await import('./kenneyTileNamer')
                  const spriteType = detectSpriteType(assetName)
                  
                  namedTiles = generateNamedTilesWithType(
                    enrichedSpriteSheetMetadata.spriteSelections.length,
                    'sprite',
                    spriteType
                  )
                  
                  detectedThemes = []
                  detectedMaterials = spriteType ? [spriteType] : []
                }
                
                // Apply semantic naming to sprite selections
                if (Object.keys(namedTiles).length > 0) {
                  console.log(`🏷️ Found ${Object.keys(namedTiles).length} named tiles, applying to ${enrichedSpriteSheetMetadata.spriteSelections.length} sprites...`)
                  applySemanticNamingToSprites(
                    enrichedSpriteSheetMetadata.spriteSelections,
                    namedTiles,
                    assetName
                  )
                } else {
                  console.warn('⚠️ No named tiles detected by analyzer - sprites will keep numeric names')
                  console.warn('   This is normal for irregular sprite sheets or unrecognized patterns')
                }
              } catch (analysisError) {
                console.error('❌ Sprite sheet analysis failed, keeping original names:', analysisError)
              }
            }
          }
          // === END NEW ===

          // === REMOVED DUPLICATE - Handled by universal analyzer above ===


          // Create asset document (filter out undefined values for Firebase)
          const asset: Asset = {
            id: assetId,
            userId,
            name: assetName,
            type: assetType,
            url,
            thumbnailUrl,
            metadata,
            uploadedAt: Date.now(),
            updatedAt: Date.now(),
            tags: options.tags || [],
            ...(enrichedTilesetMetadata && { tilesetMetadata: enrichedTilesetMetadata }),
            ...(enrichedSpriteSheetMetadata && { spriteSheetMetadata: enrichedSpriteSheetMetadata }),
            ...(options.folderId && { folderId: options.folderId })
          }

          // Save to Firebase Database
          const assetRef = dbRef(db, `assets/${userId}/${assetId}`)
          await set(assetRef, asset)
          
          // === NEW: Update catalog ===
          if (asset.type === 'tileset') {
            try {
              await updateCatalogEntry(asset)
            } catch (catalogError) {
              console.warn('Failed to update catalog:', catalogError)
              // Don't fail upload if catalog update fails
            }
          }
          // === END NEW ===

          options.onProgress?.({
            assetId,
            fileName,
            progress: 100,
            status: 'complete'
          })

          // === Final summary ===
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('✅ Asset Upload Complete!')
          console.log(`📦 Asset: ${assetName}`)
          console.log(`🏷️  Type: ${assetType}`)
          
          if (asset.type === 'spritesheet' && enrichedSpriteSheetMetadata?.spriteSelections) {
            const selections = enrichedSpriteSheetMetadata.spriteSelections
            // Check if names contain semantic prefixes (like sprite_, grass_, etc) before the final number
            const semanticCount = selections.filter(s => s.name.match(/_[a-z_]+_\d+$/i)).length
            console.log(`🎨 Sprites: ${selections.length} total`)
            if (semanticCount > 0) {
              console.log(`   └─ ${semanticCount} with semantic names`)
              console.log(`   └─ ${selections.length - semanticCount} with numeric names`)
              console.log('📝 Sample sprite names:')
              selections.slice(0, 10).forEach(s => console.log(`   - ${s.name}`))
              if (selections.length > 10) {
                console.log(`   ... and ${selections.length - 10} more`)
              }
            } else {
              console.log(`   └─ All using numeric names (pattern not recognized)`)
            }
          }
          
          if (asset.type === 'tileset' && enrichedTilesetMetadata) {
            const namedCount = Object.keys(enrichedTilesetMetadata.namedTiles || {}).length
            console.log(`🎨 Tiles: ${enrichedTilesetMetadata.tileCount} total`)
            if (namedCount > 0) {
              console.log(`   └─ ${namedCount} with semantic names`)
              console.log(`🌲 Themes: ${enrichedTilesetMetadata.themes?.join(', ') || 'none'}`)
              console.log(`🪨 Materials: ${enrichedTilesetMetadata.materials?.join(', ') || 'none'}`)
              if (enrichedTilesetMetadata.autoTileSystem) {
                console.log(`🔧 Auto-tile: ${enrichedTilesetMetadata.autoTileSystem}`)
              }
              const tileGroups = enrichedTilesetMetadata.tileGroups
              if (tileGroups && Object.keys(tileGroups).length > 0) {
                const groupSummary = Object.entries(tileGroups)
                  .map(([groupKey, group]) => `${groupKey} (${group.tileCount} variants)`)
                  .join(', ')
                console.log(`🧩 Groups: ${groupSummary}`)
                const firstGroup = Object.values(tileGroups)[0]
                if (firstGroup?.variants?.length) {
                  console.log(`   └─ Sample variants: ${firstGroup.variants.slice(0, 6).join(', ')}${firstGroup.variants.length > 6 ? '…' : ''}`)
                }
              }
            }
          }
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

          resolve(asset)
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

/**
 * Build semantic tile groups for AI consumption based on named tile metadata
 */
function buildTileSemanticGroups(
  namedTiles: Record<string, number | string>,
  context: Pick<TilesetMetadata, 'materials' | 'themes' | 'autoTileSystem'>
): Record<string, TileSemanticGroup> {
  const groups: Record<string, TileSemanticGroup> = {}
  const materials = context.materials || []
  const themes = context.themes || []

  for (const [rawName, rawIndex] of Object.entries(namedTiles)) {
    const tileIndex = typeof rawIndex === 'number' ? rawIndex : parseInt(rawIndex as string, 10)
    if (Number.isNaN(tileIndex)) {
      continue
    }

    const normalizedName = rawName.trim()
    if (!normalizedName) {
      continue
    }

    const lowerName = normalizedName.toLowerCase()
    const nameMatch = lowerName.match(/^([a-z0-9]+)[._-]?(.*)$/)
    if (!nameMatch) {
      continue
    }

    const groupKey = nameMatch[1]
    const remainder = nameMatch[2]
    const variant = remainder ? remainder.replace(/[.\s-]+/g, '_') : 'base'

    if (!groups[groupKey]) {
      const matchingMaterials = materials.filter(material => {
        const materialKey = material.toLowerCase()
        return materialKey === groupKey || groupKey.includes(materialKey) || materialKey.includes(groupKey)
      })

      const matchingThemes = themes.filter(theme => {
        const themeKey = theme.toLowerCase()
        return themeKey === groupKey || groupKey.includes(themeKey) || themeKey.includes(groupKey)
      })

      const label = groupKey.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())

      groups[groupKey] = {
        label,
        description: context.autoTileSystem
          ? `${label} auto-tiling variants (${context.autoTileSystem})`
          : `${label} tile variants`,
        autoTileSystem: context.autoTileSystem,
        materials: matchingMaterials.length > 0 ? matchingMaterials : undefined,
        themes: matchingThemes.length > 0 ? matchingThemes : undefined,
        tiles: {},
        variants: [],
        tileCount: 0
      }
    }

    const group = groups[groupKey]
    const normalizedVariant = variant || groupKey
    group.tiles[normalizedVariant] = tileIndex
    if (!group.variants.includes(normalizedVariant)) {
      group.variants.push(normalizedVariant)
    }
    group.tileCount += 1
  }

  Object.entries(groups).forEach(([groupKey, group]) => {
    group.variants.sort()

    if (!group.materials && materials.length === 1) {
      group.materials = materials
    }

    if (!group.themes && themes.length === 1) {
      group.themes = themes
    }

    if (!group.description) {
      group.description = `${group.label || groupKey} tile variants`
    }
  })

  return groups
}

/**
 * Apply semantic naming to sprite selections based on namedTiles mapping
 * Renames sprites from "filename_00" to "filename_grass_center" etc.
 */
function applySemanticNamingToSprites(
  spriteSelections: SpriteSelection[],
  namedTiles: Record<string, number | string>,
  baseFileName: string
): void {
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
  
  console.log(`🏷️ Applying semantic names to ${spriteSelections.length} sprites...`)
  console.log(`📋 Available semantic names:`, indexToName)
  
  // Update sprite names
  let renamedCount = 0
  const renamedList: string[] = []
  
  spriteSelections.forEach((sprite, index) => {
    if (indexToName[index]) {
      const oldName = sprite.name
      sprite.name = `${baseFileName}_${indexToName[index]}`
      renamedList.push(`  ${oldName} → ${sprite.name}`)
      renamedCount++
    }
    // If no semantic name found, keep the original name
  })
  
  // Show first 20 renames, then summary
  if (renamedList.length > 0) {
    console.log('📝 Sample renames (first 20):')
    renamedList.slice(0, 20).forEach(line => console.log(line))
    if (renamedList.length > 20) {
      console.log(`  ... and ${renamedList.length - 20} more`)
    }
  }
  
  console.log(`✅ Renamed ${renamedCount}/${spriteSelections.length} sprites with semantic names`)
  
  if (renamedCount === 0) {
    console.warn('⚠️ No semantic names were applied. This could mean:')
    console.warn('  - The tileset pattern was not recognized')
    console.warn('  - The analyzer returned empty namedTiles')
    console.warn('  - Detection confidence was too low')
  }
}

/**
 * Auto-detect asset type based on metadata
 */
function detectAssetType(
  metadata: AssetMetadata,
  options: { tilesetMetadata?: TilesetMetadata; spriteSheetMetadata?: SpriteSheetMetadata }
): AssetType {
  if (options.tilesetMetadata) return 'tileset'
  if (options.spriteSheetMetadata) return 'spritesheet'
  
  // Default to 'image' for now
  // Could add more sophisticated detection based on dimensions, patterns, etc.
  return 'image'
}

/**
 * Delete asset from storage and database
 */
export async function deleteAsset(assetId: string, userId: string): Promise<void> {
  try {
    // Get asset data first
    const assetRef = dbRef(db, `assets/${userId}/${assetId}`)
    const snapshot = await get(assetRef)
    
    if (!snapshot.exists()) {
      throw new Error('Asset not found')
    }

    const asset = snapshot.val() as Asset

    // Delete from Storage
    const fileRef = storageRef(storage, `assets/${userId}/${assetId}`)
    await deleteObject(fileRef)

    // Delete from Database
    await remove(assetRef)
    
    // === NEW: Remove from catalog ===
    if (asset.type === 'tileset') {
      try {
        await removeCatalogEntry(assetId, userId)
      } catch (catalogError) {
        console.warn('Failed to remove catalog entry:', catalogError)
      }
    }
    // === END NEW ===

    // TODO: Clean up references in canvases
    // This could be done in a separate cleanup service
  } catch (error) {
    throw new Error(`Failed to delete asset: ${error}`)
  }
}

/**
 * Update asset metadata
 */
export async function updateAssetMetadata(
  assetId: string,
  userId: string,
  updates: Partial<Pick<Asset, 'name' | 'tags' | 'folderId' | 'tilesetMetadata' | 'spriteSheetMetadata'>>
): Promise<void> {
  const assetRef = dbRef(db, `assets/${userId}/${assetId}`)
  
  // Check ownership
  const snapshot = await get(assetRef)
  if (!snapshot.exists()) {
    throw new Error('Asset not found')
  }

  await update(assetRef, {
    ...updates,
    updatedAt: Date.now()
  })
}

/**
 * Get asset by ID
 */
export async function getAsset(assetId: string, userId: string): Promise<Asset | null> {
  const assetRef = dbRef(db, `assets/${userId}/${assetId}`)
  const snapshot = await get(assetRef)
  
  if (!snapshot.exists()) {
    return null
  }

  return snapshot.val() as Asset
}

/**
 * Get all assets for a user
 */
export async function getUserAssets(userId: string): Promise<Asset[]> {
  const assetsRef = dbRef(db, `assets/${userId}`)
  const snapshot = await get(assetsRef)
  
  if (!snapshot.exists()) {
    return []
  }

  const assetsData = snapshot.val()
  return Object.values(assetsData) as Asset[]
}

/**
 * Replace asset file (keep metadata)
 */
export async function replaceAssetFile(
  assetId: string,
  userId: string,
  newFile: File,
  onProgress?: (progress: AssetUploadProgress) => void
): Promise<Asset> {
  // Get existing asset
  const existingAsset = await getAsset(assetId, userId)
  if (!existingAsset) {
    throw new Error('Asset not found')
  }

  // Validate new file
  const validation = validateAssetFile(newFile)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  // Extract new metadata
  const metadata = await extractImageMetadata(newFile)

  // Generate new thumbnail
  const thumbnailUrl = await generateThumbnail(newFile)

  // Upload new file to Storage
  const storagePath = `assets/${userId}/${assetId}`
  const fileRef = storageRef(storage, storagePath)

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, newFile, {
      contentType: newFile.type,
      customMetadata: {
        originalName: newFile.name,
        assetId: assetId
      }
    })

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.({
          assetId,
          fileName: newFile.name,
          progress,
          status: 'uploading'
        })
      },
      (error) => {
        reject(new Error(`Upload failed: ${error.message}`))
      },
      async () => {
        try {
          const url = await getDownloadURL(fileRef)

          // Update asset in database
          const updatedAsset: Asset = {
            ...existingAsset,
            url,
            thumbnailUrl,
            metadata,
            updatedAt: Date.now()
          }

          const assetRef = dbRef(db, `assets/${userId}/${assetId}`)
          await set(assetRef, updatedAsset)

          onProgress?.({
            assetId,
            fileName: newFile.name,
            progress: 100,
            status: 'complete'
          })

          resolve(updatedAsset)
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

/**
 * Re-analyze existing tileset
 * Uses both pattern detection and theme/material analysis
 */
export async function reanalyzeTileset(
  assetId: string,
  userId: string
): Promise<Asset> {
  const asset = await getAsset(assetId, userId)
  
  if (!asset || asset.type !== 'tileset' || !asset.tilesetMetadata) {
    throw new Error('Asset is not a tileset')
  }
  
  // Pattern analysis
  const patternAnalysis = await analyzePatterns(asset.url, {
    tileWidth: asset.tilesetMetadata.tileWidth,
    tileHeight: asset.tilesetMetadata.tileHeight,
    columns: asset.tilesetMetadata.columns,
    rows: asset.tilesetMetadata.rows,
    spacing: asset.tilesetMetadata.spacing,
    margin: asset.tilesetMetadata.margin
  })
  
  // Theme and material analysis
  const themeAnalysis = await analyzeThemesAndMaterials(asset.url, asset.name, {
    tileWidth: asset.tilesetMetadata.tileWidth,
    tileHeight: asset.tilesetMetadata.tileHeight,
    columns: asset.tilesetMetadata.columns,
    rows: asset.tilesetMetadata.rows,
    tileCount: asset.tilesetMetadata.tileCount
  })
  
  // Merge results
  const updatedMetadata: TilesetMetadata = {
    ...asset.tilesetMetadata,
    ...themeAnalysis,
    autoTileSystem: patternAnalysis.autoTileSystem || themeAnalysis.autoTileSystem,
    namedTiles: patternAnalysis.namedTiles || themeAnalysis.namedTiles || {},
    features: {
      ...patternAnalysis.features,
      ...themeAnalysis.features
    },
    detectionConfidence: {
      autoTilePattern: Math.max(
        patternAnalysis.detectionConfidence.autoTilePattern,
        themeAnalysis.detectionConfidence?.autoTilePattern || 0
      ),
      namedTiles: Math.max(
        patternAnalysis.detectionConfidence.namedTiles,
        themeAnalysis.detectionConfidence?.namedTiles || 0
      ),
      overall: (patternAnalysis.detectionConfidence.overall + (themeAnalysis.detectionConfidence?.overall || 0)) / 2
    },
    validation: {
      ...(themeAnalysis.validation || asset.tilesetMetadata.validation),
      warnings: [
        ...patternAnalysis.warnings,
        ...(themeAnalysis.validation?.warnings || [])
      ],
      checkedAt: Date.now()
    },
    version: (asset.tilesetMetadata.version || 0) + 1
  }

  if (updatedMetadata.namedTiles && Object.keys(updatedMetadata.namedTiles).length > 0) {
    const groups = buildTileSemanticGroups(updatedMetadata.namedTiles, {
      materials: updatedMetadata.materials,
      themes: updatedMetadata.themes,
      autoTileSystem: updatedMetadata.autoTileSystem
    })
    if (Object.keys(groups).length > 0) {
      updatedMetadata.tileGroups = groups
    } else {
      delete updatedMetadata.tileGroups
    }
  } else {
    delete updatedMetadata.tileGroups
  }

  await updateAssetMetadata(assetId, userId, {
    tilesetMetadata: updatedMetadata
  })
  
  const updatedAsset = { ...asset, tilesetMetadata: updatedMetadata, updatedAt: Date.now() }
  
  // Update catalog
  await updateCatalogEntry(updatedAsset)
  
  return updatedAsset
}
