/**
 * Migration Script - Move data from old structure to new multi-canvas structure (PR-22)
 * 
 * OLD STRUCTURE:
 * canvas/objects/{objectId}
 * presence/{userId}
 * 
 * NEW STRUCTURE:
 * users/{userId}/canvases/{canvasId}/ - canvas metadata
 * canvases/{canvasId}/objects/{objectId}/ - canvas objects
 * canvases/{canvasId}/permissions/{userId}/ - permissions
 * presence/{canvasId}/{userId}/ - presence per canvas
 */

import { ref, get, set } from 'firebase/database'
import { db } from '../services/firebase'

const OLD_CANVAS_PATH = 'canvas/objects'
const DEFAULT_CANVAS_ID = 'default-canvas'

interface MigrationResult {
  success: boolean
  canvasId: string
  objectsMigrated: number
  errors: string[]
}

/**
 * Migrate existing canvas data to new multi-canvas structure
 * Creates a default canvas for the user and moves all objects to it
 */
export async function migrateToMultiCanvas(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    canvasId: DEFAULT_CANVAS_ID,
    objectsMigrated: 0,
    errors: [],
  }

  try {
    // Check if migration already done (user has canvases entry)
    const userCanvasesRef = ref(db, `users/${userId}/canvases`)
    const userCanvasesSnapshot = await get(userCanvasesRef)
    
    if (userCanvasesSnapshot.exists()) {
      console.log('Migration already completed for this user')
      result.success = true
      return result
    }

    // Step 1: Read all objects from old structure
    const oldObjectsRef = ref(db, OLD_CANVAS_PATH)
    const oldObjectsSnapshot = await get(oldObjectsRef)

    if (!oldObjectsSnapshot.exists()) {
      console.log('No objects to migrate')
      
      // Create default canvas anyway (empty)
      await createDefaultCanvas(userId)
      result.success = true
      return result
    }

    const oldObjects = oldObjectsSnapshot.val()
    const objectIds = Object.keys(oldObjects)

    console.log(`Found ${objectIds.length} objects to migrate`)

    // Step 2: Create default canvas in new structure
    await createDefaultCanvas(userId)

    // Step 3: Migrate each object to new structure
    for (const objectId of objectIds) {
      try {
        const objectData = oldObjects[objectId]
        
        // Write to new location: canvases/{canvasId}/objects/{objectId}
        const newObjectRef = ref(db, `canvases/${DEFAULT_CANVAS_ID}/objects/${objectId}`)
        await set(newObjectRef, objectData)
        
        result.objectsMigrated++
      } catch (error) {
        const errorMsg = `Failed to migrate object ${objectId}: ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    // Step 4: Remove old data (optional - comment out if you want to keep backup)
    // await remove(oldObjectsRef)
    // console.log('Old data removed')

    result.success = result.errors.length === 0
    console.log(`Migration complete: ${result.objectsMigrated} objects migrated`)
    
    return result
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`
    console.error(errorMsg)
    result.errors.push(errorMsg)
    return result
  }
}

/**
 * Create default canvas for user
 */
async function createDefaultCanvas(userId: string): Promise<void> {
  const now = Date.now()
  
  // Create canvas metadata in users/{userId}/canvases/{canvasId}
  const canvasMetadata = {
    name: 'My First Canvas',
    createdAt: now,
    updatedAt: now,
    thumbnail: '', // Empty for now
    ownerId: userId,
  }
  
  const userCanvasRef = ref(db, `users/${userId}/canvases/${DEFAULT_CANVAS_ID}`)
  await set(userCanvasRef, canvasMetadata)
  
  // Create owner permission in canvases/{canvasId}/permissions/{userId}
  const permissionRef = ref(db, `canvases/${DEFAULT_CANVAS_ID}/permissions/${userId}`)
  await set(permissionRef, {
    role: 'owner',
    grantedAt: now,
  })
  
  console.log(`Created default canvas for user ${userId}`)
}

/**
 * Check if user needs migration
 */
export async function needsMigration(userId: string): Promise<boolean> {
  try {
    const userCanvasesRef = ref(db, `users/${userId}/canvases`)
    const snapshot = await get(userCanvasesRef)
    
    // If user has no canvases entry, they need migration
    return !snapshot.exists()
  } catch (error) {
    console.error('Error checking migration status:', error)
    return false
  }
}

/**
 * Auto-migrate on first login (call from App.tsx or CanvasPage)
 */
export async function autoMigrateIfNeeded(userId: string): Promise<void> {
  try {
    const needs = await needsMigration(userId)
    
    if (needs) {
      console.log('Starting automatic migration...')
      const result = await migrateToMultiCanvas(userId)
      
      if (result.success) {
        console.log(`✅ Migration successful: ${result.objectsMigrated} objects migrated`)
      } else {
        console.error('❌ Migration completed with errors:', result.errors)
      }
    }
  } catch (error) {
    console.error('Auto-migration failed:', error)
  }
}


