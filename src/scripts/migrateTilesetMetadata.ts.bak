/**
 * Tileset Metadata Migration Script
 * 
 * Migrates existing tileset assets to include enhanced metadata:
 * - Themes, materials, layer types
 * - Auto-tile system detection
 * - Named tiles
 * - Catalog entries
 * 
 * Usage:
 *   Run from browser console or as part of admin dashboard
 */

import { collection, query, where, getDocs, doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Asset, TilesetCatalogEntry } from '../types/asset'
import { analyzeTileset, loadImageData } from '../services/assets/assetAnalyzer'

/**
 * Migration statistics
 */
export interface MigrationStats {
  totalAssets: number
  processed: number
  updated: number
  failed: number
  skipped: number
  errors: Array<{ assetId: string; error: string }>
}

/**
 * Migration options
 */
export interface MigrationOptions {
  dryRun?: boolean // preview changes without saving
  batchSize?: number // process N assets at a time
  userId?: string // migrate specific user (or all if undefined)
  forceUpdate?: boolean // update even if already migrated
  createCatalog?: boolean // create catalog entries
}

/**
 * Check if asset needs migration
 */
function needsMigration(asset: Asset, forceUpdate: boolean): boolean {
  if (forceUpdate) return true
  
  const meta = asset.tilesetMetadata
  if (!meta) return false
  
  // Check if already has new fields
  if (meta.version && meta.version >= 1) {
    return false
  }
  
  return true
}

/**
 * Migrate a single tileset asset
 */
async function migrateSingleAsset(
  asset: Asset,
  options: MigrationOptions
): Promise<{ success: boolean; error?: string; updated?: Partial<Asset> }> {
  try {
    console.log(`[Migration] Processing asset: ${asset.name} (${asset.id})`)
    
    if (asset.type !== 'tileset') {
      return { success: false, error: 'Not a tileset' }
    }
    
    if (!asset.tilesetMetadata) {
      return { success: false, error: 'Missing tileset metadata' }
    }
    
    // Check if already migrated
    if (!needsMigration(asset, options.forceUpdate || false)) {
      console.log(`[Migration] Asset ${asset.id} already migrated, skipping`)
      return { success: false, error: 'Already migrated' }
    }
    
    // Load image and analyze
    console.log(`[Migration] Loading image: ${asset.url}`)
    const imageData = await loadImageData(asset.url)
    
    console.log(`[Migration] Analyzing image: ${asset.name}`)
    const enhancedMeta = await analyzeTileset(
      imageData,
      asset.name,
      {
        tileWidth: asset.tilesetMetadata.tileWidth,
        tileHeight: asset.tilesetMetadata.tileHeight,
        columns: asset.tilesetMetadata.columns,
        rows: asset.tilesetMetadata.rows,
        tileCount: asset.tilesetMetadata.tileCount
      }
    )
    
    // Merge with existing metadata
    const updatedTilesetMetadata = {
      ...asset.tilesetMetadata,
      ...enhancedMeta
    }
    
    const updatedAsset: Partial<Asset> = {
      tilesetMetadata: updatedTilesetMetadata,
      updatedAt: Date.now()
    }
    
    if (!options.dryRun) {
      // Update asset document
      const assetRef = doc(db, 'assets', asset.userId, 'userAssets', asset.id)
      await updateDoc(assetRef, updatedAsset)
      
      // Create catalog entry if requested
      if (options.createCatalog) {
        await createCatalogEntry(asset, updatedTilesetMetadata)
      }
      
      console.log(`[Migration] ✓ Updated asset: ${asset.id}`)
    } else {
      console.log(`[Migration] [DRY RUN] Would update asset: ${asset.id}`, enhancedMeta)
    }
    
    return { success: true, updated: updatedAsset }
    
  } catch (error) {
    console.error(`[Migration] ✗ Failed to migrate asset ${asset.id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Create catalog entry for asset
 */
async function createCatalogEntry(asset: Asset, tilesetMetadata: any): Promise<void> {
  if (!tilesetMetadata) return
  
  const catalogEntry: TilesetCatalogEntry = {
    id: asset.id,
    name: asset.name,
    userId: asset.userId,
    
    tileSize: tilesetMetadata.tileSize || tilesetMetadata.tileWidth,
    tileWidth: tilesetMetadata.tileWidth,
    tileHeight: tilesetMetadata.tileHeight,
    tileCount: tilesetMetadata.tileCount,
    
    themes: tilesetMetadata.themes || [],
    styles: tilesetMetadata.styles || [],
    materials: tilesetMetadata.materials || [],
    layerTypes: tilesetMetadata.layerTypes || [],
    
    features: tilesetMetadata.features || {},
    autoTileSystem: tilesetMetadata.autoTileSystem,
    
    thumbnailUrl: asset.thumbnailUrl || asset.url,
    version: tilesetMetadata.version || 1,
    updatedAt: asset.updatedAt,
    
    detectionConfidence: tilesetMetadata.detectionConfidence?.overall
  }
  
  const catalogRef = doc(db, 'assetCatalog', asset.userId, 'tilesets', asset.id)
  await setDoc(catalogRef, catalogEntry)
  
  console.log(`[Migration] ✓ Created catalog entry: ${asset.id}`)
}

/**
 * Get all tileset assets for a user
 */
async function getTilesetAssets(userId?: string): Promise<Asset[]> {
  const assets: Asset[] = []
  
  if (userId) {
    // Get assets for specific user
    const userAssetsRef = collection(db, 'assets', userId, 'userAssets')
    const q = query(userAssetsRef, where('type', '==', 'tileset'))
    const snapshot = await getDocs(q)
    
    snapshot.forEach(doc => {
      assets.push({ id: doc.id, ...doc.data() } as Asset)
    })
  } else {
    // Get all users' assets (admin only)
    // This requires listing all user documents first
    console.warn('[Migration] Migrating all users requires admin privileges')
    throw new Error('Migration of all users not implemented yet. Specify userId.')
  }
  
  return assets
}

/**
 * Migrate tileset assets in batches
 */
export async function migrateTilesetAssets(
  options: MigrationOptions = {}
): Promise<MigrationStats> {
  const {
    dryRun = false,
    batchSize = 10,
    userId,
    forceUpdate = false,
    createCatalog = true
  } = options
  
  console.log('[Migration] Starting tileset metadata migration...')
  console.log('[Migration] Options:', { dryRun, batchSize, userId, forceUpdate, createCatalog })
  
  const stats: MigrationStats = {
    totalAssets: 0,
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }
  
  try {
    // Get all tileset assets
    console.log('[Migration] Fetching tileset assets...')
    const assets = await getTilesetAssets(userId)
    stats.totalAssets = assets.length
    
    console.log(`[Migration] Found ${assets.length} tileset(s)`)
    
    if (assets.length === 0) {
      console.log('[Migration] No tilesets to migrate')
      return stats
    }
    
    // Process in batches
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize)
      console.log(`[Migration] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} assets)`)
      
      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(asset => migrateSingleAsset(asset, options))
      )
      
      // Collect statistics
      results.forEach((result, idx) => {
        stats.processed++
        
        if (result.status === 'fulfilled') {
          const { success, error } = result.value
          
          if (success) {
            stats.updated++
          } else {
            if (error === 'Already migrated' || error === 'Not a tileset') {
              stats.skipped++
            } else {
              stats.failed++
              stats.errors.push({
                assetId: batch[idx].id,
                error: error || 'Unknown error'
              })
            }
          }
        } else {
          stats.failed++
          stats.errors.push({
            assetId: batch[idx].id,
            error: result.reason?.message || 'Promise rejected'
          })
        }
      })
      
      // Progress report
      console.log(`[Migration] Progress: ${stats.processed}/${stats.totalAssets} (${stats.updated} updated, ${stats.skipped} skipped, ${stats.failed} failed)`)
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < assets.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log('[Migration] Migration complete!')
    console.log('[Migration] Final statistics:', stats)
    
    if (dryRun) {
      console.log('[Migration] ⚠ DRY RUN - No changes were saved')
    }
    
    return stats
    
  } catch (error) {
    console.error('[Migration] Migration failed:', error)
    throw error
  }
}

/**
 * Migrate assets for current user (convenience function)
 */
export async function migrateCurrentUserAssets(
  userId: string,
  dryRun: boolean = false
): Promise<MigrationStats> {
  return migrateTilesetAssets({
    userId,
    dryRun,
    batchSize: 5, // Smaller batch for user-initiated migration
    forceUpdate: false,
    createCatalog: true
  })
}

/**
 * Preview migration for a single asset
 */
export async function previewAssetMigration(assetId: string, userId: string): Promise<any> {
  const assetRef = doc(db, 'assets', userId, 'userAssets', assetId)
  const assetDoc = await getDocs(query(collection(db, 'assets', userId, 'userAssets'), where('__name__', '==', assetId)))
  
  if (assetDoc.empty) {
    throw new Error('Asset not found')
  }
  
  const asset = { id: assetDoc.docs[0].id, ...assetDoc.docs[0].data() } as Asset
  
  const result = await migrateSingleAsset(asset, { dryRun: true, createCatalog: false })
  
  return {
    asset,
    enhanced: result.updated,
    wouldUpdate: result.success
  }
}

// Export for use in browser console or admin tools
if (typeof window !== 'undefined') {
  (window as any).migrateTilesets = migrateTilesetAssets
  (window as any).previewMigration = previewAssetMigration
  console.log('[Migration] Migration tools loaded. Use window.migrateTilesets() or window.previewMigration()')
}

