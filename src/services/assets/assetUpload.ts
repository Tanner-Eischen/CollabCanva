/**
 * Asset Upload Service (PR-31)
 * Handles uploading, storing, and managing game assets (sprite sheets, tilesets, etc.)
 */

import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { ref as dbRef, set, get, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { storage, db } from '../firebase'
import { analyzeTileset as analyzePatterns, generateBasicIndex } from './tilesetAnalysis'
import { updateCatalogEntry, removeCatalogEntry } from './assetCatalog'
import { analyzeImageFromUrl as analyzeThemesAndMaterials } from './assetAnalyzer'
import {
  applySemanticNamingToSprites,
  buildTileSemanticGroups,
  cloneSpriteSheetMetadata,
  cloneTilesetMetadata,
  generateTileSlicesFromMetadata,
  type SpriteRenamingSummary
} from './metadataUtils'
import { notifyAIAssetUploaded } from '../ai/ai'
import type {
  Asset,
  AssetType,
  AssetMetadata,
  AssetValidation,
  AssetUploadProgress,
  TilesetMetadata,
  SpriteSheetMetadata
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

type TilesetAnalysisSummary = {
  namedTileCount: number
  tileGroupCount: number
  themes: string[]
  materials: string[]
  autoTileSystem?: string
  detectionConfidence?: TilesetMetadata['detectionConfidence']
  warnings?: string[]
}

type SpriteSheetAnalysisSummary = {
  spriteCount: number
  namedTileCount: number
  materials: string[]
  themes: string[]
  autoTileSystem?: string
}

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

  // Upload to Firebase Storage (public assets)
  const storagePath = `assets/${assetId}`
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
          
          // Prepare metadata copies so caller-provided objects remain untouched
          let enrichedTilesetMetadata = options.tilesetMetadata
            ? cloneTilesetMetadata(options.tilesetMetadata)
            : undefined
          let enrichedSpriteSheetMetadata = options.spriteSheetMetadata
            ? cloneSpriteSheetMetadata(options.spriteSheetMetadata)
            : undefined

          const analysisSummary: {
            tileset?: TilesetAnalysisSummary
            spriteSheet?: SpriteSheetAnalysisSummary
            spriteRenaming?: SpriteRenamingSummary
          } = {}

          if (assetType === 'tileset' && enrichedTilesetMetadata) {
            const shouldAnalyzeTileset = options.autoAnalyze !== false && !options.skipPatternDetection

            if (shouldAnalyzeTileset) {
              options.onProgress?.({
                assetId,
                fileName,
                progress: 95,
                status: 'processing'
              })

              try {
                const patternAnalysis = await analyzePatterns(url, {
                  tileWidth: enrichedTilesetMetadata.tileWidth,
                  tileHeight: enrichedTilesetMetadata.tileHeight,
                  columns: enrichedTilesetMetadata.columns,
                  rows: enrichedTilesetMetadata.rows,
                  spacing: enrichedTilesetMetadata.spacing,
                  margin: enrichedTilesetMetadata.margin
                })

                const themeAnalysis = await analyzeThemesAndMaterials(url, assetName, {
                  tileWidth: enrichedTilesetMetadata.tileWidth,
                  tileHeight: enrichedTilesetMetadata.tileHeight,
                  columns: enrichedTilesetMetadata.columns,
                  rows: enrichedTilesetMetadata.rows,
                  tileCount: enrichedTilesetMetadata.tileCount
                })

                const { detectKenneyTileset, generateKenneyMetadata } = await import('./kenneyTileNamer')
                const isKenney = detectKenneyTileset(assetName)

                if (isKenney) {
                  const kenneyMeta = generateKenneyMetadata(
                    assetName,
                    enrichedTilesetMetadata.tileCount,
                    enrichedTilesetMetadata.tileWidth,
                    enrichedTilesetMetadata.tileHeight
                  )

                  patternAnalysis.namedTiles = kenneyMeta.namedTiles
                  patternAnalysis.autoTileSystem = kenneyMeta.autoTileSystem
                  enrichedTilesetMetadata.materials = kenneyMeta.materials
                  enrichedTilesetMetadata.themes = kenneyMeta.themes
                }

                enrichedTilesetMetadata = {
                  ...enrichedTilesetMetadata,
                  ...themeAnalysis,
                  autoTileSystem: patternAnalysis.autoTileSystem || themeAnalysis.autoTileSystem,
                  namedTiles:
                    Object.keys(patternAnalysis.namedTiles || {}).length > 0
                      ? patternAnalysis.namedTiles
                      : themeAnalysis.namedTiles || enrichedTilesetMetadata.namedTiles || {},
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
                    overall:
                      (patternAnalysis.detectionConfidence.overall +
                        (themeAnalysis.detectionConfidence?.overall || patternAnalysis.detectionConfidence.overall)) /
                      2
                  },
                  validation: {
                    ...(themeAnalysis.validation || {}),
                    dimensionCheck: 'pass',
                    warnings: [
                      ...(patternAnalysis.warnings || []),
                      ...(themeAnalysis.validation?.warnings || [])
                    ],
                    checkedAt: Date.now()
                  },
                  version: 1
                }
              } catch (analysisError) {
                console.warn('[AssetUpload] Tileset analysis failed, using basic index', analysisError)

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
              }
            }

            const tileSlices = generateTileSlicesFromMetadata({
              tileWidth: enrichedTilesetMetadata.tileWidth,
              tileHeight: enrichedTilesetMetadata.tileHeight,
              columns: enrichedTilesetMetadata.columns,
              rows: enrichedTilesetMetadata.rows,
              spacing: enrichedTilesetMetadata.spacing,
              margin: enrichedTilesetMetadata.margin
            })

            if (tileSlices.length > 0) {
              enrichedTilesetMetadata.tiles = tileSlices
            } else {
              delete enrichedTilesetMetadata.tiles
            }

            if (enrichedTilesetMetadata.namedTiles && Object.keys(enrichedTilesetMetadata.namedTiles).length > 0) {
              const groups = buildTileSemanticGroups(enrichedTilesetMetadata.namedTiles, {
                materials: enrichedTilesetMetadata.materials,
                themes: enrichedTilesetMetadata.themes,
                autoTileSystem: enrichedTilesetMetadata.autoTileSystem
              })
              if (Object.keys(groups).length > 0) {
                enrichedTilesetMetadata.tileGroups = groups
              }
            }

            analysisSummary.tileset = {
              namedTileCount: Object.keys(enrichedTilesetMetadata.namedTiles || {}).length,
              tileGroupCount: Object.keys(enrichedTilesetMetadata.tileGroups || {}).length,
              themes: enrichedTilesetMetadata.themes || [],
              materials: enrichedTilesetMetadata.materials || [],
              autoTileSystem: enrichedTilesetMetadata.autoTileSystem,
              detectionConfidence: enrichedTilesetMetadata.detectionConfidence,
              warnings: enrichedTilesetMetadata.validation?.warnings
            }
          }

          if (assetType === 'spritesheet' && enrichedSpriteSheetMetadata?.spriteSelections?.length) {
            const shouldAnalyzeSpriteSheet = options.autoAnalyze !== false

            if (shouldAnalyzeSpriteSheet) {
              options.onProgress?.({
                assetId,
                fileName,
                progress: 95,
                status: 'processing'
              })

              try {
                const firstSprite = enrichedSpriteSheetMetadata.spriteSelections[0]
                const tileWidth = firstSprite.width
                const tileHeight = firstSprite.height

                const { detectKenneyTileset, generateKenneyMetadata } = await import('./kenneyTileNamer')
                const isKenney = detectKenneyTileset(assetName)

                let namedTiles: Record<string, number | string> = {}
                let detectedMaterials: string[] = []
                let detectedThemes: string[] = []
                let autoTileSystem: string | undefined

                if (isKenney) {
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
                } else {
                  const { detectSpriteType, generateNamedTilesWithType } = await import('./kenneyTileNamer')
                  const spriteType = detectSpriteType(assetName)

                  namedTiles = generateNamedTilesWithType(
                    enrichedSpriteSheetMetadata.spriteSelections.length,
                    'sprite',
                    spriteType
                  )

                  detectedMaterials = spriteType ? [spriteType] : []
                  detectedThemes = []
                }

                if (Object.keys(namedTiles).length > 0) {
                  analysisSummary.spriteRenaming = applySemanticNamingToSprites(
                    enrichedSpriteSheetMetadata.spriteSelections,
                    namedTiles,
                    assetName
                  )
                }

                analysisSummary.spriteSheet = {
                  spriteCount: enrichedSpriteSheetMetadata.spriteSelections.length,
                  namedTileCount: Object.keys(namedTiles).length,
                  materials: detectedMaterials,
                  themes: detectedThemes,
                  autoTileSystem
                }
              } catch (analysisError) {
                console.warn('[AssetUpload] Sprite sheet analysis failed, keeping original names', analysisError)
              }
            } else {
              analysisSummary.spriteSheet = {
                spriteCount: enrichedSpriteSheetMetadata.spriteSelections.length,
                namedTileCount: 0,
                materials: [],
                themes: [],
                autoTileSystem: undefined
              }
            }
          }

          if (
            assetType === 'tileset' &&
            enrichedTilesetMetadata?.namedTiles &&
            enrichedSpriteSheetMetadata?.spriteSelections
          ) {
            analysisSummary.spriteRenaming = applySemanticNamingToSprites(
              enrichedSpriteSheetMetadata.spriteSelections,
              enrichedTilesetMetadata.namedTiles,
              assetName
            )
          }

          // === REMOVED DUPLICATE - Handled by universal analyzer above ===

          if (enrichedSpriteSheetMetadata?.spriteSelections) {
            const colorCounts = new Map<string, number>()
            const inferredMaterials = new Set<string>()
            const inferredThemes = new Set<string>()

            enrichedSpriteSheetMetadata.spriteSelections.forEach(selection => {
              selection.dominantColors?.forEach(color => {
                colorCounts.set(color, (colorCounts.get(color) || 0) + 1)
              })

              if (selection.category) {
                const category = selection.category.toLowerCase()
                if (category.includes('tree') || category.includes('bush')) {
                  inferredMaterials.add('wood')
                  inferredMaterials.add('foliage')
                  inferredThemes.add('forest')
                }
                if (category.includes('water')) {
                  inferredMaterials.add('water')
                  inferredThemes.add('water')
                }
                if (category.includes('crystal')) {
                  inferredMaterials.add('crystal')
                  inferredThemes.add('mystic')
                }
                if (category.includes('structure')) {
                  inferredMaterials.add('stone')
                }
                if (category.includes('light')) {
                  inferredMaterials.add('light')
                }
              }
            })

            const palette = Array.from(colorCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([color]) => color)

            if (palette.length > 0) {
              enrichedSpriteSheetMetadata.palette = palette
            }
            if (inferredMaterials.size > 0) {
              enrichedSpriteSheetMetadata.inferredMaterials = Array.from(inferredMaterials)
            }
            if (inferredThemes.size > 0) {
              enrichedSpriteSheetMetadata.inferredThemes = Array.from(inferredThemes)
            }
          }

          // Create asset document (filter out undefined values for Firebase)
          const asset: Asset = {
            id: assetId,
            userId,
            name: assetName,
            type: assetType,
            url,
            thumbnailUrl,
            metadata,
            createdAt: Date.now(),
            uploadedAt: Date.now(),
            updatedAt: Date.now(),
            tags: options.tags || [],
            ...(enrichedTilesetMetadata && { tilesetMetadata: enrichedTilesetMetadata }),
            ...(enrichedSpriteSheetMetadata && { spriteSheetMetadata: enrichedSpriteSheetMetadata }),
            ...(options.folderId && { folderId: options.folderId })
          }

          // Save to Firebase Database (public assets structure)
          const assetRef = dbRef(db, `assets/${assetId}`)
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

          if (!analysisSummary.spriteSheet && enrichedSpriteSheetMetadata?.spriteSelections) {
            analysisSummary.spriteSheet = {
              spriteCount: enrichedSpriteSheetMetadata.spriteSelections.length,
              namedTileCount: analysisSummary.spriteRenaming?.renamedCount || 0,
              materials: [],
              themes: [],
              autoTileSystem: undefined
            }
          }

          // Ensure tileset summary is set with defaults if not already set
          if (!analysisSummary.tileset && assetType === 'tileset' && enrichedTilesetMetadata) {
            analysisSummary.tileset = {
              namedTileCount: Object.keys(enrichedTilesetMetadata.namedTiles || {}).length,
              tileGroupCount: Object.keys(enrichedTilesetMetadata.tileGroups || {}).length,
              themes: enrichedTilesetMetadata.themes || [],
              materials: enrichedTilesetMetadata.materials || [],
              autoTileSystem: enrichedTilesetMetadata.autoTileSystem,
              detectionConfidence: enrichedTilesetMetadata.detectionConfidence,
              warnings: enrichedTilesetMetadata.validation?.warnings
            }
          }

          const summaryPayload = {
            assetId,
            assetName,
            assetType,
            tileset: analysisSummary.tileset,
            spriteSheet: analysisSummary.spriteSheet,
            spriteRenaming: analysisSummary.spriteRenaming,
            spriteCount: enrichedSpriteSheetMetadata?.spriteSelections?.length
          }

          console.info('[AssetUpload] Upload complete', summaryPayload)

          notifyAIAssetUploaded(userId, asset, summaryPayload).then(message => {
            if (message) {
              console.info('[AssetUpload] AI suggestions', message)
            }
          }).catch(error => {
            console.warn('[AssetUpload] Failed to notify AI about asset upload', error)
          })

          resolve(asset)
        } catch (error) {
          reject(error)
        }
      }
    )
  })
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
    const assetRef = dbRef(db, `assets/${assetId}`)
    const snapshot = await get(assetRef)
    
    if (!snapshot.exists()) {
      throw new Error('Asset not found')
    }

    const asset = snapshot.val() as Asset
    
    // Verify ownership
    if (asset.userId !== userId) {
      throw new Error('Permission denied: You can only delete your own assets')
    }

    // Delete from Storage
    const fileRef = storageRef(storage, `assets/${assetId}`)
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
  const assetRef = dbRef(db, `assets/${assetId}`)
  
  // Check ownership
  const snapshot = await get(assetRef)
  if (!snapshot.exists()) {
    throw new Error('Asset not found')
  }
  
  const asset = snapshot.val() as Asset
  if (asset.userId !== userId) {
    throw new Error('Permission denied: You can only update your own assets')
  }

  await update(assetRef, {
    ...updates,
    updatedAt: Date.now()
  })
}

/**
 * Get asset by ID (public read)
 */
export async function getAsset(assetId: string): Promise<Asset | null> {
  const assetRef = dbRef(db, `assets/${assetId}`)
  const snapshot = await get(assetRef)
  
  if (!snapshot.exists()) {
    return null
  }

  return snapshot.val() as Asset
}

/**
 * Get all assets for a user (query-based)
 */
export async function getUserAssets(userId: string): Promise<Asset[]> {
  const assetsRef = dbRef(db, 'assets')
  const userAssetsQuery = query(
    assetsRef,
    orderByChild('userId'),
    equalTo(userId)
  )
  
  const snapshot = await get(userAssetsQuery)
  
  if (!snapshot.exists()) {
    return []
  }

  const assets: Asset[] = []
  snapshot.forEach((childSnapshot) => {
    assets.push(childSnapshot.val() as Asset)
  })

  return assets
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
  const existingAsset = await getAsset(assetId)
  if (!existingAsset) {
    throw new Error('Asset not found')
  }
  
  // Verify ownership
  if (existingAsset.userId !== userId) {
    throw new Error('Permission denied: You can only replace your own assets')
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

  // Upload new file to Storage (public assets)
  const storagePath = `assets/${assetId}`
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

          const assetRef = dbRef(db, `assets/${assetId}`)
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
  const asset = await getAsset(assetId)
  
  if (!asset || asset.type !== 'tileset' || !asset.tilesetMetadata) {
    throw new Error('Asset is not a tileset')
  }
  
  // Verify ownership
  if (asset.userId !== userId) {
    throw new Error('Permission denied: You can only re-analyze your own assets')
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
      seamQuality: (themeAnalysis.validation?.seamQuality ?? asset.tilesetMetadata.validation?.seamQuality),
      dimensionCheck: themeAnalysis.validation?.dimensionCheck ?? asset.tilesetMetadata.validation?.dimensionCheck ?? 'fail',
      warnings: [
        ...patternAnalysis.warnings,
        ...(themeAnalysis.validation?.warnings || [])
      ],
      checkedAt: Date.now()
    },
    version: (asset.tilesetMetadata.version || 0) + 1
  }

  const reanalyzedSlices = generateTileSlicesFromMetadata({
    tileWidth: updatedMetadata.tileWidth,
    tileHeight: updatedMetadata.tileHeight,
    columns: updatedMetadata.columns,
    rows: updatedMetadata.rows,
    spacing: updatedMetadata.spacing,
    margin: updatedMetadata.margin
  })

  if (reanalyzedSlices.length > 0) {
    updatedMetadata.tiles = reanalyzedSlices
  } else {
    delete updatedMetadata.tiles
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
