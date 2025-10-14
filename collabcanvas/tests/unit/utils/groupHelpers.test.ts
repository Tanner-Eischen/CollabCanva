/**
 * Unit Tests for Group Helper Utilities (PR-19)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateGroupBounds,
  isInGroup,
  isInAnyGroup,
  getAllGroupMembers,
  getGroupShapes,
  getGroupCenter,
  hasCircularDependency,
  getGroupDepth,
  getTopLevelGroups,
  getChildGroups,
  updateGroupBounds,
} from '../../../src/utils/groupHelpers'
import type { Shape } from '../../../src/types/canvas'
import type { Group } from '../../../src/types/group'

describe('Group Helper Utilities', () => {
  const mockShapes: Shape[] = [
    {
      id: 'shape-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: '#3B82F6',
    },
    {
      id: 'shape-2',
      type: 'circle',
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      fill: '#3B82F6',
    },
    {
      id: 'shape-3',
      type: 'rectangle',
      x: 400,
      y: 400,
      width: 100,
      height: 100,
      fill: '#3B82F6',
    },
  ]

  const mockGroups: Group[] = [
    {
      id: 'group-1',
      name: 'Group 1',
      memberIds: ['shape-1', 'shape-2'],
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      rotation: 0,
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      zIndex: 0,
    },
    {
      id: 'group-2',
      name: 'Group 2',
      memberIds: ['shape-3'],
      x: 400,
      y: 400,
      width: 100,
      height: 100,
      rotation: 0,
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      zIndex: 0,
    },
  ]

  describe('calculateGroupBounds', () => {
    it('should calculate correct bounding box for multiple shapes', () => {
      const shapes = [mockShapes[0], mockShapes[1]] // shape-1 and shape-2
      const bounds = calculateGroupBounds(shapes)

      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(300) // from x=0 to x=300 (200+100)
      expect(bounds.height).toBe(300) // from y=0 to y=300 (200+100)
    })

    it('should return zero bounds for empty array', () => {
      const bounds = calculateGroupBounds([])

      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(0)
      expect(bounds.height).toBe(0)
    })

    it('should handle single shape', () => {
      const shapes = [mockShapes[0]]
      const bounds = calculateGroupBounds(shapes)

      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(100)
      expect(bounds.height).toBe(100)
    })

    it('should handle shapes with negative coordinates', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-negative',
          type: 'rectangle',
          x: -100,
          y: -50,
          width: 100,
          height: 100,
          fill: '#3B82F6',
        },
        {
          id: 'shape-positive',
          type: 'rectangle',
          x: 100,
          y: 50,
          width: 100,
          height: 100,
          fill: '#3B82F6',
        },
      ]

      const bounds = calculateGroupBounds(shapes)

      expect(bounds.x).toBe(-100)
      expect(bounds.y).toBe(-50)
      expect(bounds.width).toBe(300) // from -100 to 200
      expect(bounds.height).toBe(200) // from -50 to 150
    })

    it('should include nested groups in calculation', () => {
      const shapes = [mockShapes[0]]
      const groups = [mockGroups[1]] // group-2 at (400, 400) with size 100x100

      const bounds = calculateGroupBounds(shapes, groups)

      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(500) // from 0 to 500 (400+100)
      expect(bounds.height).toBe(500) // from 0 to 500 (400+100)
    })
  })

  describe('isInGroup', () => {
    it('should return true if shape is in group', () => {
      const result = isInGroup('shape-1', 'group-1', mockGroups)
      expect(result).toBe(true)
    })

    it('should return false if shape is not in group', () => {
      const result = isInGroup('shape-3', 'group-1', mockGroups)
      expect(result).toBe(false)
    })

    it('should return false if group does not exist', () => {
      const result = isInGroup('shape-1', 'nonexistent', mockGroups)
      expect(result).toBe(false)
    })
  })

  describe('isInAnyGroup', () => {
    it('should return group ID if shape is in a group', () => {
      const result = isInAnyGroup('shape-1', mockGroups)
      expect(result).toBe('group-1')
    })

    it('should return null if shape is not in any group', () => {
      const result = isInAnyGroup('shape-nonexistent', mockGroups)
      expect(result).toBeNull()
    })
  })

  describe('getAllGroupMembers', () => {
    it('should return all member IDs for simple group', () => {
      const members = getAllGroupMembers('group-1', mockGroups)
      expect(members).toEqual(['shape-1', 'shape-2'])
    })

    it('should return empty array for nonexistent group', () => {
      const members = getAllGroupMembers('nonexistent', mockGroups)
      expect(members).toEqual([])
    })

    it('should handle nested groups recursively', () => {
      const nestedGroups: Group[] = [
        {
          id: 'parent-group',
          name: 'Parent Group',
          memberIds: ['shape-1', 'child-group'],
          x: 0,
          y: 0,
          width: 300,
          height: 300,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'child-group',
          name: 'Child Group',
          memberIds: ['shape-2', 'shape-3'],
          x: 200,
          y: 200,
          width: 300,
          height: 300,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
      ]

      const members = getAllGroupMembers('parent-group', nestedGroups)
      expect(members).toContain('shape-1')
      expect(members).toContain('child-group')
      expect(members).toContain('shape-2')
      expect(members).toContain('shape-3')
    })

    it('should respect max depth limit', () => {
      // Create a deeply nested structure
      const deepGroups: Group[] = []
      for (let i = 0; i < 15; i++) {
        deepGroups.push({
          id: `group-${i}`,
          name: `Group ${i}`,
          memberIds: i === 14 ? ['shape-1'] : [`group-${i + 1}`],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        })
      }

      const members = getAllGroupMembers('group-0', deepGroups, 5)
      // Should stop at depth 5, so won't get all the way to shape-1
      expect(members.length).toBeLessThan(15)
    })
  })

  describe('getGroupShapes', () => {
    it('should return all shapes in a group', () => {
      const shapes = getGroupShapes('group-1', mockGroups, mockShapes)
      expect(shapes).toHaveLength(2)
      expect(shapes[0].id).toBe('shape-1')
      expect(shapes[1].id).toBe('shape-2')
    })

    it('should return empty array for nonexistent group', () => {
      const shapes = getGroupShapes('nonexistent', mockGroups, mockShapes)
      expect(shapes).toEqual([])
    })
  })

  describe('getGroupCenter', () => {
    it('should calculate center point correctly', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 }
      const center = getGroupCenter(bounds)

      expect(center.x).toBe(50)
      expect(center.y).toBe(50)
    })

    it('should handle non-square bounds', () => {
      const bounds = { x: 100, y: 200, width: 400, height: 200 }
      const center = getGroupCenter(bounds)

      expect(center.x).toBe(300) // 100 + 400/2
      expect(center.y).toBe(300) // 200 + 200/2
    })
  })

  describe('hasCircularDependency', () => {
    it('should detect self-reference', () => {
      const result = hasCircularDependency('group-1', 'group-1', mockGroups)
      expect(result).toBe(true)
    })

    it('should allow non-circular relationships', () => {
      const result = hasCircularDependency('group-1', 'shape-3', mockGroups)
      expect(result).toBe(false)
    })

    it('should detect circular reference in nested groups', () => {
      const circularGroups: Group[] = [
        {
          id: 'group-a',
          name: 'Group A',
          memberIds: ['group-b'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'group-b',
          name: 'Group B',
          memberIds: ['group-c'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'group-c',
          name: 'Group C',
          memberIds: ['shape-1'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
      ]

      // Try to add group-a to group-c (which is already a descendant of group-a)
      const result = hasCircularDependency('group-c', 'group-a', circularGroups)
      expect(result).toBe(true)
    })
  })

  describe('getGroupDepth', () => {
    it('should return 1 for simple group', () => {
      const depth = getGroupDepth('group-1', mockGroups)
      expect(depth).toBe(1)
    })

    it('should return 0 for nonexistent group', () => {
      const depth = getGroupDepth('nonexistent', mockGroups)
      expect(depth).toBe(0)
    })

    it('should calculate depth for nested groups', () => {
      const nestedGroups: Group[] = [
        {
          id: 'parent',
          name: 'Parent',
          memberIds: ['child1', 'child2'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'child1',
          name: 'Child 1',
          memberIds: ['grandchild'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'child2',
          name: 'Child 2',
          memberIds: ['shape-1'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'grandchild',
          name: 'Grandchild',
          memberIds: ['shape-2'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
      ]

      const depth = getGroupDepth('parent', nestedGroups)
      expect(depth).toBe(3) // parent -> child1 -> grandchild
    })
  })

  describe('getTopLevelGroups', () => {
    it('should return all groups when none are nested', () => {
      const topLevel = getTopLevelGroups(mockGroups)
      expect(topLevel).toHaveLength(2)
    })

    it('should return only top-level groups when nesting exists', () => {
      const nestedGroups: Group[] = [
        {
          id: 'parent',
          name: 'Parent',
          memberIds: ['child'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'child',
          name: 'Child',
          memberIds: ['shape-1'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
      ]

      const topLevel = getTopLevelGroups(nestedGroups)
      expect(topLevel).toHaveLength(1)
      expect(topLevel[0].id).toBe('parent')
    })
  })

  describe('getChildGroups', () => {
    it('should return empty array for group with no child groups', () => {
      const children = getChildGroups('group-1', mockGroups)
      expect(children).toEqual([])
    })

    it('should return child groups', () => {
      const nestedGroups: Group[] = [
        {
          id: 'parent',
          name: 'Parent',
          memberIds: ['child1', 'child2', 'shape-1'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'child1',
          name: 'Child 1',
          memberIds: ['shape-2'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
        {
          id: 'child2',
          name: 'Child 2',
          memberIds: ['shape-3'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'user-1',
          zIndex: 0,
        },
      ]

      const children = getChildGroups('parent', nestedGroups)
      expect(children).toHaveLength(2)
      expect(children.map((c) => c.id)).toContain('child1')
      expect(children.map((c) => c.id)).toContain('child2')
    })
  })

  describe('updateGroupBounds', () => {
    it('should calculate bounds from member shapes', () => {
      const group = mockGroups[0] // group-1 with shape-1 and shape-2
      const bounds = updateGroupBounds(group, mockShapes, mockGroups)

      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(300)
      expect(bounds.height).toBe(300)
    })

    it('should include child groups in bounds calculation', () => {
      const parentGroup: Group = {
        id: 'parent',
        name: 'Parent',
        memberIds: ['shape-1', 'group-2'],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'user-1',
        zIndex: 0,
      }

      const bounds = updateGroupBounds(parentGroup, mockShapes, mockGroups)

      // Should include shape-1 (0,0 to 100,100) and group-2 (400,400 to 500,500)
      expect(bounds.x).toBe(0)
      expect(bounds.y).toBe(0)
      expect(bounds.width).toBe(500)
      expect(bounds.height).toBe(500)
    })
  })
})

