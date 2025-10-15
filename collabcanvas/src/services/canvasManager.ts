/**
 * Canvas Manager Service (PR-22)
 * Manages canvas CRUD operations, permissions, and thumbnails
 */

import { ref, set, get, remove, update } from 'firebase/database'
import { db } from './firebase'
import type Konva from 'konva'

export interface CanvasMetadata {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  thumbnail: string // base64 PNG
  ownerId: string
}

export interface CanvasPermission {
  role: 'owner' | 'editor' | 'viewer'
  grantedAt: number
}

/**
 * Generate unique canvas ID
 */
function generateCanvasId(): string {
  return `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new canvas with metadata and owner permission
 */
export async function createCanvas(
  name: string,
  userId: string
): Promise<CanvasMetadata> {
  const canvasId = generateCanvasId()
  const now = Date.now()

  const metadata: CanvasMetadata = {
    id: canvasId,
    name,
    createdAt: now,
    updatedAt: now,
    thumbnail: '',
    ownerId: userId,
  }

  try {
    // Create canvas metadata in users/{userId}/canvases/{canvasId}
    const userCanvasRef = ref(db, `users/${userId}/canvases/${canvasId}`)
    await set(userCanvasRef, metadata)

    // Create owner permission in canvases/{canvasId}/permissions/{userId}
    const permissionRef = ref(db, `canvases/${canvasId}/permissions/${userId}`)
    await set(permissionRef, {
      role: 'owner',
      grantedAt: now,
    } as CanvasPermission)

    console.log(`Canvas created: ${canvasId}`)
    return metadata
  } catch (error) {
    console.error('Error creating canvas:', error)
    throw error
  }
}

/**
 * Delete canvas and all associated data
 */
export async function deleteCanvas(
  canvasId: string,
  userId: string
): Promise<void> {
  try {
    // Remove canvas metadata from user's list
    const userCanvasRef = ref(db, `users/${userId}/canvases/${canvasId}`)
    await remove(userCanvasRef)

    // Remove all canvas data (objects, groups, permissions)
    const canvasRef = ref(db, `canvases/${canvasId}`)
    await remove(canvasRef)

    // Remove presence data for this canvas
    const presenceRef = ref(db, `presence/${canvasId}`)
    await remove(presenceRef)

    console.log(`Canvas deleted: ${canvasId}`)
  } catch (error) {
    console.error('Error deleting canvas:', error)
    throw error
  }
}

/**
 * Update canvas metadata (name, thumbnail)
 * Special handling for public-whiteboard
 */
export async function updateCanvas(
  canvasId: string,
  userId: string,
  updates: Partial<Pick<CanvasMetadata, 'name' | 'thumbnail'>>
): Promise<void> {
  try {
    // Collab Spaces: shared themed boards
    const collabSpaces = [
      'collab-art', 'collab-design', 'collab-education', 
      'collab-content', 'collab-gamedev', 
      'collab-architecture'
    ]
    
    if (collabSpaces.includes(canvasId)) {
      const publicRef = ref(db, `collab-spaces/${canvasId}/metadata`)
      await update(publicRef, {
        ...updates,
        updatedAt: Date.now(),
      })
      console.log(`Collab space ${canvasId} updated`)
      return
    }
    
    const userCanvasRef = ref(db, `users/${userId}/canvases/${canvasId}`)

    const updateData: any = {
      ...updates,
      updatedAt: Date.now(),
    }

    await update(userCanvasRef, updateData)
    console.log(`Canvas updated: ${canvasId}`)
  } catch (error) {
    console.error('Error updating canvas:', error)
    throw error
  }
}

/**
 * Get list of user's canvases (owned + shared)
 */
export async function getCanvasList(
  userId: string
): Promise<CanvasMetadata[]> {
  try {
    // Get canvases owned by user
    const userCanvasesRef = ref(db, `users/${userId}/canvases`)
    const snapshot = await get(userCanvasesRef)

    if (!snapshot.exists()) {
      return []
    }

    const canvasesData = snapshot.val()
    const canvases: CanvasMetadata[] = Object.values(canvasesData)

    // Sort by updatedAt (most recent first)
    canvases.sort((a, b) => b.updatedAt - a.updatedAt)

    return canvases
  } catch (error) {
    console.error('Error getting canvas list:', error)
    throw error
  }
}

/**
 * Duplicate canvas with all objects
 */
export async function duplicateCanvas(
  sourceCanvasId: string,
  userId: string
): Promise<CanvasMetadata> {
  try {
    // Get source canvas metadata
    const sourceMetadataRef = ref(db, `users/${userId}/canvases/${sourceCanvasId}`)
    const metadataSnapshot = await get(sourceMetadataRef)

    if (!metadataSnapshot.exists()) {
      throw new Error('Source canvas not found')
    }

    const sourceMetadata = metadataSnapshot.val() as CanvasMetadata

    // Create new canvas
    const newCanvas = await createCanvas(
      `${sourceMetadata.name} (Copy)`,
      userId
    )

    // Copy all objects
    const sourceObjectsRef = ref(db, `canvases/${sourceCanvasId}/objects`)
    const objectsSnapshot = await get(sourceObjectsRef)

    if (objectsSnapshot.exists()) {
      const objects = objectsSnapshot.val()
      const newObjectsRef = ref(db, `canvases/${newCanvas.id}/objects`)
      await set(newObjectsRef, objects)
      console.log(`Copied objects from ${sourceCanvasId} to ${newCanvas.id}`)
    }

    // Copy all groups (if any)
    const sourceGroupsRef = ref(db, `canvases/${sourceCanvasId}/groups`)
    const groupsSnapshot = await get(sourceGroupsRef)

    if (groupsSnapshot.exists()) {
      const groups = groupsSnapshot.val()
      const newGroupsRef = ref(db, `canvases/${newCanvas.id}/groups`)
      await set(newGroupsRef, groups)
      console.log(`Copied groups from ${sourceCanvasId} to ${newCanvas.id}`)
    }

    console.log(`Canvas duplicated: ${sourceCanvasId} → ${newCanvas.id}`)
    return newCanvas
  } catch (error) {
    console.error('Error duplicating canvas:', error)
    throw error
  }
}

/**
 * Generate thumbnail from Konva Stage (300x200 PNG)
 */
export function generateThumbnail(stage: Konva.Stage | null): string {
  if (!stage) {
    return ''
  }

  try {
    // Create thumbnail at 300x200 resolution
    const thumbnailWidth = 300
    const thumbnailHeight = 200

    // Calculate scale to fit canvas in thumbnail
    const stageWidth = stage.width()
    const stageHeight = stage.height()
    const scale = Math.min(
      thumbnailWidth / stageWidth,
      thumbnailHeight / stageHeight
    )

    // Generate base64 PNG
    const dataURL = stage.toDataURL({
      pixelRatio: scale,
      mimeType: 'image/png',
      quality: 0.8,
    })

    return dataURL
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return ''
  }
}

/**
 * Get canvas by ID (checks if user has permission)
 */
export async function getCanvas(
  canvasId: string,
  userId: string
): Promise<CanvasMetadata | null> {
  try {
    // Collab Spaces: shared themed boards for all users
    const collabSpaces = [
      'public-board', // Main public collaboration board
      'collab-art', 'collab-design', 'collab-education', 
      'collab-content', 'collab-gamedev', 
      'collab-architecture'
    ]
    
    if (collabSpaces.includes(canvasId)) {
      const publicRef = ref(db, `collab-spaces/${canvasId}/metadata`)
      const snapshot = await get(publicRef)
      
      if (!snapshot.exists()) {
        // Create themed board if it doesn't exist
        let name: string
        if (canvasId === 'public-board') {
          name = '🌍 Public Collaboration Board'
        } else {
          const themeName = canvasId.replace('collab-', '')
          name = `${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Collab Space`
        }
        
        const publicCanvas: CanvasMetadata = {
          id: canvasId,
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          thumbnail: '',
          ownerId: 'system',
        }
        await set(publicRef, publicCanvas)
        return publicCanvas
      }
      
      return snapshot.val() as CanvasMetadata
    }
    
    const userCanvasRef = ref(db, `users/${userId}/canvases/${canvasId}`)
    const snapshot = await get(userCanvasRef)

    if (!snapshot.exists()) {
      return null
    }

    return snapshot.val() as CanvasMetadata
  } catch (error) {
    console.error('Error getting canvas:', error)
    throw error
  }
}

/**
 * Check if user has permission to access canvas
 */
export async function hasCanvasPermission(
  canvasId: string,
  userId: string
): Promise<boolean> {
  try {
    const permissionRef = ref(db, `canvases/${canvasId}/permissions/${userId}`)
    const snapshot = await get(permissionRef)

    return snapshot.exists()
  } catch (error) {
    console.error('Error checking canvas permission:', error)
    return false
  }
}

/**
 * Get user's permission role for canvas
 */
export async function getCanvasPermission(
  canvasId: string,
  userId: string
): Promise<CanvasPermission | null> {
  try {
    const permissionRef = ref(db, `canvases/${canvasId}/permissions/${userId}`)
    const snapshot = await get(permissionRef)

    if (!snapshot.exists()) {
      return null
    }

    return snapshot.val() as CanvasPermission
  } catch (error) {
    console.error('Error getting canvas permission:', error)
    return null
  }
}


