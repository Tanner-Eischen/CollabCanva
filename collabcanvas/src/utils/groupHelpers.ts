/**
 * Group Helper Utilities (PR-19)
 * Functions for calculating group bounds and managing group membership
 */

import type { Shape } from '../types/canvas'
import type { Group, GroupBounds } from '../types/group'

/**
 * Calculate bounding box for a group based on member positions
 */
export function calculateGroupBounds(
  members: Shape[],
  groups?: Group[]
): GroupBounds {
  if (members.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  // Initialize with first member bounds
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  members.forEach((member) => {
    // For shapes, use their position and dimensions
    const memberMinX = member.x
    const memberMinY = member.y
    const memberMaxX = member.x + member.width
    const memberMaxY = member.y + member.height

    minX = Math.min(minX, memberMinX)
    minY = Math.min(minY, memberMinY)
    maxX = Math.max(maxX, memberMaxX)
    maxY = Math.max(maxY, memberMaxY)
  })

  // Also consider nested groups if provided
  if (groups && groups.length > 0) {
    groups.forEach((group) => {
      minX = Math.min(minX, group.x)
      minY = Math.min(minY, group.y)
      maxX = Math.max(maxX, group.x + group.width)
      maxY = Math.max(maxY, group.y + group.height)
    })
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Check if a shape is a member of a specific group
 */
export function isInGroup(shapeId: string, groupId: string, groups: Group[]): boolean {
  const group = groups.find((g) => g.id === groupId)
  if (!group) {
    return false
  }
  return group.memberIds.includes(shapeId)
}

/**
 * Check if a shape is in any group
 */
export function isInAnyGroup(shapeId: string, groups: Group[]): string | null {
  for (const group of groups) {
    if (group.memberIds.includes(shapeId)) {
      return group.id
    }
  }
  return null
}

/**
 * Get all member IDs of a group, including nested groups (recursive)
 * @param maxDepth Maximum nesting depth to prevent infinite loops (default: 10)
 */
export function getAllGroupMembers(
  groupId: string,
  groups: Group[],
  maxDepth: number = 10,
  currentDepth: number = 0
): string[] {
  if (currentDepth >= maxDepth) {
    console.warn(`Maximum group nesting depth (${maxDepth}) reached`)
    return []
  }

  const group = groups.find((g) => g.id === groupId)
  if (!group) {
    return []
  }

  const allMembers: string[] = []

  for (const memberId of group.memberIds) {
    allMembers.push(memberId)

    // Check if this member is itself a group (nested group)
    const nestedGroup = groups.find((g) => g.id === memberId)
    if (nestedGroup) {
      // Recursively get members of nested group
      const nestedMembers = getAllGroupMembers(
        memberId,
        groups,
        maxDepth,
        currentDepth + 1
      )
      allMembers.push(...nestedMembers)
    }
  }

  return allMembers
}

/**
 * Get all shapes that are members of a group (including nested groups)
 */
export function getGroupShapes(
  groupId: string,
  groups: Group[],
  allShapes: Shape[]
): Shape[] {
  const memberIds = getAllGroupMembers(groupId, groups)
  return allShapes.filter((shape) => memberIds.includes(shape.id))
}

/**
 * Calculate the center point of a group
 */
export function getGroupCenter(bounds: GroupBounds): { x: number; y: number } {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

/**
 * Check if groups form a circular dependency
 */
export function hasCircularDependency(
  groupId: string,
  potentialMemberId: string,
  groups: Group[]
): boolean {
  // If we're adding the group itself as a member, that's circular
  if (groupId === potentialMemberId) {
    return true
  }

  // Check if the potential member is a group that contains our group
  const allMembers = getAllGroupMembers(potentialMemberId, groups)
  return allMembers.includes(groupId)
}

/**
 * Get the depth level of a group in the hierarchy
 */
export function getGroupDepth(groupId: string, groups: Group[]): number {
  const group = groups.find((g) => g.id === groupId)
  if (!group) {
    return 0
  }

  let maxChildDepth = 0
  for (const memberId of group.memberIds) {
    const childGroup = groups.find((g) => g.id === memberId)
    if (childGroup) {
      const childDepth = getGroupDepth(memberId, groups)
      maxChildDepth = Math.max(maxChildDepth, childDepth)
    }
  }

  return maxChildDepth + 1
}

/**
 * Get all top-level groups (groups that are not members of other groups)
 */
export function getTopLevelGroups(groups: Group[]): Group[] {
  return groups.filter((group) => {
    // Check if this group is a member of any other group
    return !groups.some((otherGroup) =>
      otherGroup.memberIds.includes(group.id)
    )
  })
}

/**
 * Get child groups of a specific group
 */
export function getChildGroups(groupId: string, groups: Group[]): Group[] {
  const group = groups.find((g) => g.id === groupId)
  if (!group) {
    return []
  }

  return groups.filter((g) => group.memberIds.includes(g.id))
}

/**
 * Update group bounds based on member shapes
 */
export function updateGroupBounds(
  group: Group,
  shapes: Shape[],
  groups: Group[]
): GroupBounds {
  const memberShapes = shapes.filter((shape) =>
    group.memberIds.includes(shape.id)
  )
  // Get groups that are members of this group
  const memberGroups = groups.filter((g) =>
    group.memberIds.includes(g.id)
  )
  
  return calculateGroupBounds(memberShapes, memberGroups)
}

