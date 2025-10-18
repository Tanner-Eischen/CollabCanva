/**
 * Asset Folder System Service
 * Organize assets in folders with nested hierarchy
 * PR-31: Asset Organization
 */

import { ref, set, get, remove, query, orderByChild, equalTo, update } from 'firebase/database'
import { db } from '../firebase'
import type { Asset } from '../../types/asset'

export interface AssetFolder {
  id: string
  userId: string
  name: string
  parentId: string | null // null = root level
  color?: string // optional color for visual organization
  icon?: string // optional icon emoji
  createdAt: number
  updatedAt: number
}

/**
 * Generate unique folder ID
 */
function generateFolderId(): string {
  return `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  name: string,
  parentId: string | null = null,
  options: { color?: string; icon?: string } = {}
): Promise<string> {
  const folderId = generateFolderId()
  const now = Date.now()

  const folder: AssetFolder = {
    id: folderId,
    userId,
    name,
    parentId,
    color: options.color,
    icon: options.icon,
    createdAt: now,
    updatedAt: now,
  }

  const folderRef = ref(db, `assetFolders/${folderId}`)
  await set(folderRef, folder)

  return folderId
}

/**
 * Get all folders for a user
 */
export async function getUserFolders(userId: string): Promise<AssetFolder[]> {
  const foldersRef = ref(db, 'assetFolders')
  const userQuery = query(foldersRef, orderByChild('userId'), equalTo(userId))
  
  const snapshot = await get(userQuery)
  
  if (!snapshot.exists()) {
    return []
  }

  const folders: AssetFolder[] = []
  snapshot.forEach((childSnapshot) => {
    folders.push(childSnapshot.val() as AssetFolder)
  })

  return folders
}

/**
 * Get folders by parent ID
 */
export async function getFoldersByParent(
  userId: string,
  parentId: string | null
): Promise<AssetFolder[]> {
  const folders = await getUserFolders(userId)
  return folders.filter((folder) => folder.parentId === parentId)
}

/**
 * Get folder by ID
 */
export async function getFolder(folderId: string): Promise<AssetFolder | null> {
  const folderRef = ref(db, `assetFolders/${folderId}`)
  const snapshot = await get(folderRef)
  
  if (!snapshot.exists()) {
    return null
  }

  return snapshot.val() as AssetFolder
}

/**
 * Update folder properties
 */
export async function updateFolder(
  folderId: string,
  updates: Partial<Omit<AssetFolder, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const folderRef = ref(db, `assetFolders/${folderId}`)
  
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: Date.now(),
  }

  await update(folderRef, updatesWithTimestamp)
}

/**
 * Delete folder and move contents to parent or root
 */
export async function deleteFolder(
  folderId: string,
  userId: string
): Promise<void> {
  // Get folder to find its parent
  const folder = await getFolder(folderId)
  if (!folder) {
    throw new Error('Folder not found')
  }

  // Move all assets in this folder to parent or root
  const assetsRef = ref(db, `assets/${userId}`)
  const assetsSnapshot = await get(assetsRef)

  if (assetsSnapshot.exists()) {
    const updates: Record<string, any> = {}
    const nextFolderId = folder.parentId ?? null
    const timestamp = Date.now()

    assetsSnapshot.forEach((childSnapshot) => {
      const asset = childSnapshot.val() as Asset | null
      const assetId = childSnapshot.key

      if (!assetId || !asset) {
        return
      }

      const currentFolder = asset.folderId ?? null
      if (currentFolder === folderId) {
        updates[`assets/${userId}/${assetId}/folderId`] = nextFolderId
        updates[`assets/${userId}/${assetId}/updatedAt`] = timestamp
      }
    })

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates)
    }
  }

  // Move all subfolders to parent
  const subfolders = await getFoldersByParent(userId, folderId)
  await Promise.all(
    subfolders.map((subfolder) =>
      updateFolder(subfolder.id, { parentId: folder.parentId })
    )
  )

  // Delete the folder
  const folderRef = ref(db, `assetFolders/${folderId}`)
  await remove(folderRef)
}

/**
 * Move asset to a folder
 */
export async function moveAssetToFolder(
  assetId: string,
  userId: string,
  folderId: string | null
): Promise<void> {
  const assetRef = ref(db, `assets/${userId}/${assetId}`)
  await update(assetRef, { folderId: folderId ?? null, updatedAt: Date.now() })
}

/**
 * Get all assets in a folder
 */
export async function getAssetsInFolder(
  userId: string,
  folderId: string | null
): Promise<string[]> {
  const assetsRef = ref(db, `assets/${userId}`)
  const snapshot = await get(assetsRef)

  if (!snapshot.exists()) {
    return []
  }

  const assets = snapshot.val() as Record<string, Asset>
  return Object.entries(assets)
    .filter(([, asset]) => (asset?.folderId ?? null) === (folderId ?? null))
    .map(([assetId]) => assetId)
}

/**
 * Get folder hierarchy path (for breadcrumbs)
 */
export async function getFolderPath(folderId: string): Promise<AssetFolder[]> {
  const path: AssetFolder[] = []
  let currentId: string | null = folderId

  while (currentId) {
    const folder = await getFolder(currentId)
    if (!folder) break
    
    path.unshift(folder) // Add to beginning
    currentId = folder.parentId
  }

  return path
}

/**
 * Check if folder name is unique within parent
 */
export async function isFolderNameUnique(
  userId: string,
  name: string,
  parentId: string | null,
  excludeFolderId?: string
): Promise<boolean> {
  const folders = await getFoldersByParent(userId, parentId)
  
  return !folders.some(
    (folder) =>
      folder.name.toLowerCase() === name.toLowerCase() &&
      folder.id !== excludeFolderId
  )
}

/**
 * Rename folder
 */
export async function renameFolder(
  folderId: string,
  newName: string,
  userId: string
): Promise<void> {
  const folder = await getFolder(folderId)
  if (!folder) {
    throw new Error('Folder not found')
  }

  // Check if name is unique
  const isUnique = await isFolderNameUnique(
    userId,
    newName,
    folder.parentId,
    folderId
  )

  if (!isUnique) {
    throw new Error('A folder with this name already exists in the same location')
  }

  await updateFolder(folderId, { name: newName })
}

/**
 * Move folder to new parent
 */
export async function moveFolder(
  folderId: string,
  newParentId: string | null
): Promise<void> {
  const folder = await getFolder(folderId)
  if (!folder) {
    throw new Error('Folder not found')
  }

  // Prevent circular references
  if (newParentId) {
    let checkParentId: string | null = newParentId
    while (checkParentId) {
      if (checkParentId === folderId) {
        throw new Error('Cannot move folder into itself or its descendant')
      }
      const parentFolder = await getFolder(checkParentId)
      checkParentId = parentFolder?.parentId || null
    }
  }

  await updateFolder(folderId, { parentId: newParentId })
}

