/**
 * Group Sync Service (PR-19)
 * Manages group operations with Firebase synchronization
 */

import { ref, set, get, remove, update } from 'firebase/database'
import { db } from '../firebase'
import type { Group } from '../../types/group'

/**
 * Generate unique group ID
 */
function generateGroupId(): string {
  return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new group with member shapes
 */
export async function syncCreateGroup(
  canvasId: string,
  memberIds: string[],
  userId: string,
  name?: string
): Promise<Group> {
  if (memberIds.length < 2) {
    throw new Error('Group must contain at least 2 members')
  }

  const groupId = generateGroupId()
  const now = Date.now()

  const group: Group = {
    id: groupId,
    name: name || `Group ${groupId.slice(-4)}`,
    memberIds,
    x: 0, // Will be calculated by groupHelpers
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    locked: false,
    visible: true,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    zIndex: 0,
  }

  try {
    const groupRef = ref(db, `canvases/${canvasId}/groups/${groupId}`)
    await set(groupRef, group)
    console.log(`Group created: ${groupId}`)
    return group
  } catch (error) {
    console.error('Error creating group:', error)
    throw error
  }
}

/**
 * Update group properties
 */
export async function syncUpdateGroup(
  canvasId: string,
  groupId: string,
  updates: Partial<Omit<Group, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const groupRef = ref(db, `canvases/${canvasId}/groups/${groupId}`)
    
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    }

    await update(groupRef, updateData)
    console.log(`Group updated: ${groupId}`)
  } catch (error) {
    console.error('Error updating group:', error)
    throw error
  }
}

/**
 * Delete group (ungroup - keep members)
 */
export async function syncDeleteGroup(
  canvasId: string,
  groupId: string
): Promise<void> {
  try {
    const groupRef = ref(db, `canvases/${canvasId}/groups/${groupId}`)
    await remove(groupRef)
    console.log(`Group deleted: ${groupId}`)
  } catch (error) {
    console.error('Error deleting group:', error)
    throw error
  }
}

/**
 * Add shape to existing group
 */
export async function syncAddToGroup(
  canvasId: string,
  groupId: string,
  shapeId: string
): Promise<void> {
  try {
    // Get current group
    const groupRef = ref(db, `canvases/${canvasId}/groups/${groupId}`)
    const snapshot = await get(groupRef)

    if (!snapshot.exists()) {
      throw new Error('Group not found')
    }

    const group = snapshot.val() as Group

    // Check if shape is already in group
    if (group.memberIds.includes(shapeId)) {
      console.log('Shape already in group')
      return
    }

    // Add shape to memberIds
    const updatedMemberIds = [...group.memberIds, shapeId]

    await syncUpdateGroup(canvasId, groupId, {
      memberIds: updatedMemberIds,
    })

    console.log(`Added ${shapeId} to group ${groupId}`)
  } catch (error) {
    console.error('Error adding to group:', error)
    throw error
  }
}

/**
 * Remove shape from group
 */
export async function syncRemoveFromGroup(
  canvasId: string,
  groupId: string,
  shapeId: string
): Promise<void> {
  try {
    // Get current group
    const groupRef = ref(db, `canvases/${canvasId}/groups/${groupId}`)
    const snapshot = await get(groupRef)

    if (!snapshot.exists()) {
      throw new Error('Group not found')
    }

    const group = snapshot.val() as Group

    // Remove shape from memberIds
    const updatedMemberIds = group.memberIds.filter((id) => id !== shapeId)

    // If group has less than 2 members after removal, delete the group
    if (updatedMemberIds.length < 2) {
      await syncDeleteGroup(canvasId, groupId)
      console.log(`Group ${groupId} dissolved (too few members)`)
      return
    }

    await syncUpdateGroup(canvasId, groupId, {
      memberIds: updatedMemberIds,
    })

    console.log(`Removed ${shapeId} from group ${groupId}`)
  } catch (error) {
    console.error('Error removing from group:', error)
    throw error
  }
}

/**
 * Get all groups for a canvas
 */
export async function syncGetGroups(canvasId: string): Promise<Group[]> {
  try {
    const groupsRef = ref(db, `canvases/${canvasId}/groups`)
    const snapshot = await get(groupsRef)

    if (!snapshot.exists()) {
      return []
    }

    const groupsData = snapshot.val()
    return Object.values(groupsData) as Group[]
  } catch (error) {
    console.error('Error getting groups:', error)
    throw error
  }
}

/**
 * Get single group by ID
 */
export async function syncGetGroup(
  canvasId: string,
  groupId: string
): Promise<Group | null> {
  try {
    const groupRef = ref(db, `canvases/${canvasId}/groups/${groupId}`)
    const snapshot = await get(groupRef)

    if (!snapshot.exists()) {
      return null
    }

    return snapshot.val() as Group
  } catch (error) {
    console.error('Error getting group:', error)
    throw error
  }
}

/**
 * Check if shape is in any group
 */
export async function syncIsInGroup(
  canvasId: string,
  shapeId: string
): Promise<string | null> {
  try {
    const groups = await syncGetGroups(canvasId)
    
    for (const group of groups) {
      if (group.memberIds.includes(shapeId)) {
        return group.id
      }
    }

    return null
  } catch (error) {
    console.error('Error checking if in group:', error)
    return null
  }
}


