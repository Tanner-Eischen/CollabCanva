/**
 * useGroups Hook (PR-19)
 * Hook for managing group state and operations with Firebase sync
 */

import { useState, useCallback, useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '../services/firebase'
import type { Group } from '../types/group'
import type { Shape } from '../types/canvas'
import {
  syncCreateGroup,
  syncUpdateGroup,
  syncDeleteGroup,
  syncAddToGroup,
  syncRemoveFromGroup,
} from '../services/groupSync'
import {
  isInAnyGroup,
  getAllGroupMembers,
  getGroupShapes,
  hasCircularDependency,
  updateGroupBounds,
} from '../utils/groupHelpers'

interface UseGroupsOptions {
  canvasId: string
  userId: string
  enableSync?: boolean
}

interface UseGroupsReturn {
  groups: Group[]
  createGroup: (shapeIds: string[], name?: string) => Promise<string | null>
  ungroup: (groupId: string) => Promise<void>
  addToGroup: (groupId: string, shapeId: string) => Promise<void>
  removeFromGroup: (groupId: string, shapeId: string) => Promise<void>
  updateGroup: (groupId: string, updates: Partial<Omit<Group, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>
  getGroupById: (groupId: string) => Group | undefined
  isShapeInGroup: (shapeId: string) => string | null
  getGroupMembers: (groupId: string) => string[]
  calculateBounds: (groupId: string, shapes: Shape[]) => { x: number; y: number; width: number; height: number } | null
}

/**
 * Hook for managing groups with Firebase sync
 * Handles group creation, updates, deletion, and membership operations
 */
export function useGroups(options?: UseGroupsOptions): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([])
  const syncEnabled = options?.enableSync ?? true
  const canvasId = options?.canvasId ?? 'default-canvas'
  const userId = options?.userId ?? 'anonymous'

  /**
   * Subscribe to groups changes from Firebase
   */
  useEffect(() => {
    if (!syncEnabled) return

    const groupsRef = ref(db, `canvases/${canvasId}/groups`)

    const handleGroupsChange = (snapshot: any) => {
      if (snapshot.exists()) {
        const groupsData = snapshot.val()
        const groupsArray = Object.values(groupsData) as Group[]
        setGroups(groupsArray)
      } else {
        setGroups([])
      }
    }

    onValue(groupsRef, handleGroupsChange)

    return () => {
      off(groupsRef, 'value', handleGroupsChange)
    }
  }, [canvasId, syncEnabled])

  /**
   * Create a new group from selected shapes
   */
  const createGroup = useCallback(
    async (shapeIds: string[], name?: string): Promise<string | null> => {
      if (shapeIds.length < 2) {
        console.warn('Cannot create group with less than 2 shapes')
        return null
      }

      // Check for circular dependencies
      for (const shapeId of shapeIds) {
        // Check if any of the shapes are groups that would create a circular dependency
        const potentialGroup = groups.find((g) => g.id === shapeId)
        if (potentialGroup) {
          for (const otherShapeId of shapeIds) {
            if (shapeId !== otherShapeId && hasCircularDependency(shapeId, otherShapeId, groups)) {
              console.error('Cannot create group: circular dependency detected')
              return null
            }
          }
        }
      }

      try {
        const group = await syncCreateGroup(canvasId, shapeIds, userId, name)
        console.log(`Group created: ${group.id}`)
        return group.id
      } catch (error) {
        console.error('Error creating group:', error)
        return null
      }
    },
    [canvasId, userId, groups]
  )

  /**
   * Dissolve a group (ungroup) - keeps member shapes
   */
  const ungroup = useCallback(
    async (groupId: string): Promise<void> => {
      try {
        await syncDeleteGroup(canvasId, groupId)
        console.log(`Group ungrouped: ${groupId}`)
      } catch (error) {
        console.error('Error ungrouping:', error)
        throw error
      }
    },
    [canvasId]
  )

  /**
   * Add a shape to an existing group
   */
  const addToGroup = useCallback(
    async (groupId: string, shapeId: string): Promise<void> => {
      // Check for circular dependency
      if (hasCircularDependency(groupId, shapeId, groups)) {
        console.error('Cannot add to group: circular dependency detected')
        return
      }

      try {
        await syncAddToGroup(canvasId, groupId, shapeId)
        console.log(`Added ${shapeId} to group ${groupId}`)
      } catch (error) {
        console.error('Error adding to group:', error)
        throw error
      }
    },
    [canvasId, groups]
  )

  /**
   * Remove a shape from a group
   */
  const removeFromGroup = useCallback(
    async (groupId: string, shapeId: string): Promise<void> => {
      try {
        await syncRemoveFromGroup(canvasId, groupId, shapeId)
        console.log(`Removed ${shapeId} from group ${groupId}`)
      } catch (error) {
        console.error('Error removing from group:', error)
        throw error
      }
    },
    [canvasId]
  )

  /**
   * Update group properties
   */
  const updateGroup = useCallback(
    async (
      groupId: string,
      updates: Partial<Omit<Group, 'id' | 'createdAt' | 'createdBy'>>
    ): Promise<void> => {
      try {
        await syncUpdateGroup(canvasId, groupId, updates)
        console.log(`Group updated: ${groupId}`)
      } catch (error) {
        console.error('Error updating group:', error)
        throw error
      }
    },
    [canvasId]
  )

  /**
   * Get group by ID
   */
  const getGroupById = useCallback(
    (groupId: string): Group | undefined => {
      return groups.find((g) => g.id === groupId)
    },
    [groups]
  )

  /**
   * Check if a shape is in any group
   */
  const isShapeInGroup = useCallback(
    (shapeId: string): string | null => {
      return isInAnyGroup(shapeId, groups)
    },
    [groups]
  )

  /**
   * Get all member IDs of a group (including nested groups)
   */
  const getGroupMembers = useCallback(
    (groupId: string): string[] => {
      return getAllGroupMembers(groupId, groups)
    },
    [groups]
  )

  /**
   * Calculate group bounding box from member positions
   */
  const calculateBounds = useCallback(
    (groupId: string, shapes: Shape[]): { x: number; y: number; width: number; height: number } | null => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) {
        return null
      }

      const memberShapes = getGroupShapes(groupId, groups, shapes)
      if (memberShapes.length === 0) {
        return null
      }

      return updateGroupBounds(group, shapes, groups)
    },
    [groups]
  )

  return {
    groups,
    createGroup,
    ungroup,
    addToGroup,
    removeFromGroup,
    updateGroup,
    getGroupById,
    isShapeInGroup,
    getGroupMembers,
    calculateBounds,
  }
}

