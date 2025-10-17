/**
 * Asset Catalog Service
 * Maintains lightweight index for fast asset discovery
 */

import { ref as dbRef, set, get, remove } from 'firebase/database'
import { db } from '../firebase'
import type { Asset, TilesetCatalogEntry } from '../../types/asset'

/**
 * Update catalog entry for a tileset
 */
export async function updateCatalogEntry(asset: Asset): Promise<void> {
  if (asset.type !== 'tileset' || !asset.tilesetMetadata) {
    return
  }
  
  const { tilesetMetadata } = asset
  
  // Compute tileSize if square
  const tileSize = tilesetMetadata.tileWidth === tilesetMetadata.tileHeight
    ? tilesetMetadata.tileWidth
    : Math.max(tilesetMetadata.tileWidth, tilesetMetadata.tileHeight)
  
  const entry: TilesetCatalogEntry = {
    id: asset.id,
    name: asset.name,
    userId: asset.userId,
    tileSize,
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
  
  // Store in catalog
  const catalogRef = dbRef(db, `catalog/tilesets/${asset.userId}/${asset.id}`)
  await set(catalogRef, entry)
  
  // Update index (for quick scanning)
  const indexRef = dbRef(db, `catalog/index/${asset.userId}/${asset.id}`)
  await set(indexRef, {
    id: asset.id,
    name: asset.name,
    tileSize,
    updatedAt: asset.updatedAt
  })
}

/**
 * Remove catalog entry
 */
export async function removeCatalogEntry(assetId: string, userId: string): Promise<void> {
  const catalogRef = dbRef(db, `catalog/tilesets/${userId}/${assetId}`)
  const indexRef = dbRef(db, `catalog/index/${userId}/${assetId}`)
  
  await Promise.all([
    remove(catalogRef),
    remove(indexRef)
  ])
}

/**
 * Load all catalog entries for a user
 */
export async function loadUserCatalog(userId: string): Promise<TilesetCatalogEntry[]> {
  const catalogRef = dbRef(db, `catalog/tilesets/${userId}`)
  const snapshot = await get(catalogRef)
  
  if (!snapshot.exists()) {
    return []
  }
  
  return Object.values(snapshot.val()) as TilesetCatalogEntry[]
}

/**
 * Get single catalog entry
 */
export async function getCatalogEntry(assetId: string, userId: string): Promise<TilesetCatalogEntry | null> {
  const catalogRef = dbRef(db, `catalog/tilesets/${userId}/${assetId}`)
  const snapshot = await get(catalogRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  return snapshot.val() as TilesetCatalogEntry
}

