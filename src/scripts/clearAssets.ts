/**
 * Clear Assets Script
 * 
 * DANGEROUS: Deletes all assets for the current user
 * - Removes from Firebase Database (/assets and /assetCatalog)
 * - Removes from Firebase Storage
 * 
 * Usage: Run this from the browser console or as a standalone script
 */

import { ref as dbRef, remove, get } from 'firebase/database'
import { ref as storageRef, deleteObject, listAll } from 'firebase/storage'
import { db, storage } from '../services/firebase'
import { getAuth } from 'firebase/auth'

/**
 * Clear all assets for a specific user
 */
export async function clearUserAssets(userId: string, dryRun: boolean = true): Promise<{
  assetsDeleted: number
  catalogDeleted: number
  storageFilesDeleted: number
  errors: string[]
}> {
  console.log(`🗑️ ${dryRun ? 'DRY RUN:' : ''} Clearing assets for user: ${userId}`)
  
  const results = {
    assetsDeleted: 0,
    catalogDeleted: 0,
    storageFilesDeleted: 0,
    errors: [] as string[]
  }
  
  try {
    // 1. Get all assets from database
    const assetsRef = dbRef(db, `assets/${userId}`)
    const snapshot = await get(assetsRef)
    
    if (!snapshot.exists()) {
      console.log('✅ No assets found for this user')
      return results
    }
    
    const assets = snapshot.val()
    const assetIds = Object.keys(assets)
    
    console.log(`📊 Found ${assetIds.length} assets to delete`)
    
    if (dryRun) {
      console.log('🔍 DRY RUN - Would delete:')
      assetIds.forEach(id => {
        console.log(`  - ${assets[id].name} (${assets[id].type})`)
      })
      results.assetsDeleted = assetIds.length
      results.catalogDeleted = assetIds.length
      return results
    }
    
    // 2. Delete from Firebase Database
    console.log('🗄️ Deleting from database...')
    
    for (const assetId of assetIds) {
      try {
        // Delete from /assets
        await remove(dbRef(db, `assets/${userId}/${assetId}`))
        results.assetsDeleted++
        
        // Delete from /assetCatalog
        await remove(dbRef(db, `assetCatalog/${userId}/${assetId}`))
        results.catalogDeleted++
        
        console.log(`  ✓ Deleted ${assets[assetId].name}`)
      } catch (err) {
        const error = `Failed to delete asset ${assetId}: ${err}`
        console.error(`  ✗ ${error}`)
        results.errors.push(error)
      }
    }
    
    // 3. Delete from Firebase Storage
    console.log('☁️ Deleting from storage...')
    
    try {
      const userStorageRef = storageRef(storage, `assets/${userId}`)
      const storageList = await listAll(userStorageRef)
      
      console.log(`📦 Found ${storageList.items.length} files in storage`)
      
      for (const itemRef of storageList.items) {
        try {
          await deleteObject(itemRef)
          results.storageFilesDeleted++
          console.log(`  ✓ Deleted ${itemRef.name}`)
        } catch (err) {
          const error = `Failed to delete storage file ${itemRef.name}: ${err}`
          console.error(`  ✗ ${error}`)
          results.errors.push(error)
        }
      }
    } catch (err) {
      const error = `Failed to list storage files: ${err}`
      console.error(`  ✗ ${error}`)
      results.errors.push(error)
    }
    
    console.log('✅ Asset cleanup complete!')
    console.log(`📊 Summary:`)
    console.log(`  - Database assets deleted: ${results.assetsDeleted}`)
    console.log(`  - Catalog entries deleted: ${results.catalogDeleted}`)
    console.log(`  - Storage files deleted: ${results.storageFilesDeleted}`)
    
    if (results.errors.length > 0) {
      console.warn(`⚠️ ${results.errors.length} errors occurred:`)
      results.errors.forEach(err => console.warn(`  - ${err}`))
    }
    
  } catch (err) {
    const error = `Fatal error during cleanup: ${err}`
    console.error(`❌ ${error}`)
    results.errors.push(error)
  }
  
  return results
}

/**
 * Clear assets for the currently logged-in user
 */
export async function clearCurrentUserAssets(dryRun: boolean = true) {
  const auth = getAuth()
  const user = auth.currentUser
  
  if (!user) {
    throw new Error('No user is currently logged in. Please log in first.')
  }
  
  console.log(`👤 Current user: ${user.email} (${user.uid})`)
  
  if (!dryRun) {
    const confirmed = confirm(
      `⚠️ WARNING ⚠️\n\n` +
      `This will permanently delete ALL assets for:\n` +
      `${user.email}\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you absolutely sure?`
    )
    
    if (!confirmed) {
      console.log('❌ Cancelled by user')
      return null
    }
  }
  
  return await clearUserAssets(user.uid, dryRun)
}

/**
 * Browser console helper
 * 
 * Open browser console and run:
 * 
 * // Dry run (preview what would be deleted)
 * window.clearAssets()
 * 
 * // Actually delete (asks for confirmation)
 * window.clearAssets(false)
 */
if (typeof window !== 'undefined') {
  (window as any).clearAssets = clearCurrentUserAssets
  console.log('💡 Asset cleaner loaded! Run: window.clearAssets() or window.clearAssets(false)')
}

// Export for direct use
export default clearCurrentUserAssets

