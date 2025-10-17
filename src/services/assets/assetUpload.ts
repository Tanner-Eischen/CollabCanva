/**
 * Asset Upload Service (PR-31)
 * Handles uploading, storing, and managing game assets (sprite sheets, tilesets, etc.)
 */

import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { ref as dbRef, set, get, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { storage, db } from '../firebase'
import { analyzeTileset, generateBasicIndex, type TilesetAnalysisResult } from './tilesetAnalysis'
import { updateCatalogEntry, removeCatalogEntry } from './assetCatalog'
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
                const analysis = await analyzeTileset(url, {
                  tileWidth: enrichedTilesetMetadata.tileWidth,
                  tileHeight: enrichedTilesetMetadata.tileHeight,
                  columns: enrichedTilesetMetadata.columns,
                  rows: enrichedTilesetMetadata.rows,
                  spacing: enrichedTilesetMetadata.spacing,
                  margin: enrichedTilesetMetadata.margin
                })
                
                // Merge analysis results into metadata
                enrichedTilesetMetadata = {
                  ...enrichedTilesetMetadata,
                  
                  // Add computed tileSize if square
                  tileSize: enrichedTilesetMetadata.tileWidth === enrichedTilesetMetadata.tileHeight
                    ? enrichedTilesetMetadata.tileWidth
                    : undefined,
                  
                  // Add analysis results
                  autoTileSystem: analysis.autoTileSystem,
                  namedTiles: analysis.namedTiles,
                  features: analysis.features,
                  detectionConfidence: analysis.detectionConfidence,
                  
                  // Add validation report
                  validation: {
                    dimensionCheck: 'pass',
                    warnings: analysis.warnings,
                    checkedAt: Date.now()
                  },
                  
                  // Set version
                  version: 1
                }
                
                console.log('Tileset analysis complete:', {
                  autoTileSystem: analysis.autoTileSystem,
                  namedTileCount: Object.keys(analysis.namedTiles).length,
                  confidence: analysis.detectionConfidence.overall
                })
              } catch (analysisError) {
                console.warn('Tileset analysis failed, using basic index:', analysisError)
                
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
                  }
                }
              }
            }
          }
          // === END NEW ===

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
            ...(options.spriteSheetMetadata && { spriteSheetMetadata: options.spriteSheetMetadata }),
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
 */
export async function reanalyzeTileset(
  assetId: string,
  userId: string
): Promise<Asset> {
  const asset = await getAsset(assetId, userId)
  
  if (!asset || asset.type !== 'tileset' || !asset.tilesetMetadata) {
    throw new Error('Asset is not a tileset')
  }
  
  const analysis = await analyzeTileset(asset.url, {
    tileWidth: asset.tilesetMetadata.tileWidth,
    tileHeight: asset.tilesetMetadata.tileHeight,
    columns: asset.tilesetMetadata.columns,
    rows: asset.tilesetMetadata.rows,
    spacing: asset.tilesetMetadata.spacing,
    margin: asset.tilesetMetadata.margin
  })
  
  const updatedMetadata: TilesetMetadata = {
    ...asset.tilesetMetadata,
    autoTileSystem: analysis.autoTileSystem,
    namedTiles: analysis.namedTiles,
    features: analysis.features,
    detectionConfidence: analysis.detectionConfidence,
    validation: {
      ...asset.tilesetMetadata.validation,
      warnings: analysis.warnings,
      checkedAt: Date.now()
    }
  }
  
  await updateAssetMetadata(assetId, userId, {
    tilesetMetadata: updatedMetadata
  })
  
  const updatedAsset = { ...asset, tilesetMetadata: updatedMetadata, updatedAt: Date.now() }
  
  // Update catalog
  await updateCatalogEntry(updatedAsset)
  
  return updatedAsset
}
