/**
 * Unit Tests for Group Sync Service (PR-19)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  syncCreateGroup,
  syncUpdateGroup,
  syncDeleteGroup,
  syncAddToGroup,
  syncRemoveFromGroup,
  syncGetGroups,
  syncGetGroup,
  syncIsInGroup,
} from '../../../src/services/groupSync'
import type { Group } from '../../../src/types/group'

// Mock Firebase
vi.mock('../../../src/services/firebase', () => ({
  db: {},
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
}))

import { ref, set, get, remove, update } from 'firebase/database'

describe('Group Sync Service', () => {
  const mockCanvasId = 'test-canvas-123'
  const mockUserId = 'user-123'
  const mockShapeIds = ['shape-1', 'shape-2', 'shape-3']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('syncCreateGroup', () => {
    it('should create a group with member IDs', async () => {
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(set).mockResolvedValue(undefined)

      const group = await syncCreateGroup(mockCanvasId, mockShapeIds, mockUserId)

      expect(group).toBeDefined()
      expect(group.memberIds).toEqual(mockShapeIds)
      expect(group.memberIds.length).toBe(3)
      expect(group.createdBy).toBe(mockUserId)
      expect(group.locked).toBe(false)
      expect(group.visible).toBe(true)
      expect(ref).toHaveBeenCalledWith({}, `canvases/${mockCanvasId}/groups/${group.id}`)
      expect(set).toHaveBeenCalledWith(mockRef, group)
    })

    it('should create group with custom name', async () => {
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(set).mockResolvedValue(undefined)

      const customName = 'My Custom Group'
      const group = await syncCreateGroup(mockCanvasId, mockShapeIds, mockUserId, customName)

      expect(group.name).toBe(customName)
    })

    it('should generate default name when not provided', async () => {
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(set).mockResolvedValue(undefined)

      const group = await syncCreateGroup(mockCanvasId, mockShapeIds, mockUserId)

      expect(group.name).toMatch(/^Group /)
    })

    it('should throw error with less than 2 members', async () => {
      await expect(
        syncCreateGroup(mockCanvasId, ['shape-1'], mockUserId)
      ).rejects.toThrow('Group must contain at least 2 members')
    })

    it('should set initial position and dimensions to 0', async () => {
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(set).mockResolvedValue(undefined)

      const group = await syncCreateGroup(mockCanvasId, mockShapeIds, mockUserId)

      expect(group.x).toBe(0)
      expect(group.y).toBe(0)
      expect(group.width).toBe(0)
      expect(group.height).toBe(0)
      expect(group.rotation).toBe(0)
    })

    it('should set timestamps correctly', async () => {
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(set).mockResolvedValue(undefined)

      const beforeTime = Date.now()
      const group = await syncCreateGroup(mockCanvasId, mockShapeIds, mockUserId)
      const afterTime = Date.now()

      expect(group.createdAt).toBeGreaterThanOrEqual(beforeTime)
      expect(group.createdAt).toBeLessThanOrEqual(afterTime)
      expect(group.updatedAt).toBe(group.createdAt)
    })
  })

  describe('syncUpdateGroup', () => {
    it('should update group properties', async () => {
      const mockGroupId = 'group-123'
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(update).mockResolvedValue(undefined)

      const updates = {
        name: 'Updated Group Name',
        x: 100,
        y: 200,
        locked: true,
      }

      await syncUpdateGroup(mockCanvasId, mockGroupId, updates)

      expect(ref).toHaveBeenCalledWith({}, `canvases/${mockCanvasId}/groups/${mockGroupId}`)
      expect(update).toHaveBeenCalledWith(mockRef, expect.objectContaining({
        ...updates,
        updatedAt: expect.any(Number),
      }))
    })

    it('should update timestamp on update', async () => {
      const mockGroupId = 'group-123'
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(update).mockResolvedValue(undefined)

      const beforeTime = Date.now()
      await syncUpdateGroup(mockCanvasId, mockGroupId, { name: 'New Name' })
      const afterTime = Date.now()

      const updateCall = vi.mocked(update).mock.calls[0][1] as any
      expect(updateCall.updatedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(updateCall.updatedAt).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('syncDeleteGroup', () => {
    it('should remove group from Firebase', async () => {
      const mockGroupId = 'group-123'
      const mockRef = {}
      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(remove).mockResolvedValue(undefined)

      await syncDeleteGroup(mockCanvasId, mockGroupId)

      expect(ref).toHaveBeenCalledWith({}, `canvases/${mockCanvasId}/groups/${mockGroupId}`)
      expect(remove).toHaveBeenCalledWith(mockRef)
    })
  })

  describe('syncAddToGroup', () => {
    it('should add shape ID to group memberIds', async () => {
      const mockGroupId = 'group-123'
      const newShapeId = 'shape-4'
      const mockRef = {}
      const mockGroup: Group = {
        id: mockGroupId,
        name: 'Test Group',
        memberIds: mockShapeIds,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: mockUserId,
        zIndex: 0,
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroup,
      } as any)
      vi.mocked(update).mockResolvedValue(undefined)

      await syncAddToGroup(mockCanvasId, mockGroupId, newShapeId)

      expect(get).toHaveBeenCalledWith(mockRef)
      expect(update).toHaveBeenCalledWith(mockRef, expect.objectContaining({
        memberIds: [...mockShapeIds, newShapeId],
      }))
    })

    it('should not add duplicate shape ID', async () => {
      const mockGroupId = 'group-123'
      const existingShapeId = 'shape-2'
      const mockRef = {}
      const mockGroup: Group = {
        id: mockGroupId,
        name: 'Test Group',
        memberIds: mockShapeIds,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: mockUserId,
        zIndex: 0,
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroup,
      } as any)

      await syncAddToGroup(mockCanvasId, mockGroupId, existingShapeId)

      expect(update).not.toHaveBeenCalled()
    })

    it('should throw error if group not found', async () => {
      const mockGroupId = 'nonexistent-group'
      const mockRef = {}

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => false,
      } as any)

      await expect(
        syncAddToGroup(mockCanvasId, mockGroupId, 'shape-4')
      ).rejects.toThrow('Group not found')
    })
  })

  describe('syncRemoveFromGroup', () => {
    it('should remove shape ID from group memberIds', async () => {
      const mockGroupId = 'group-123'
      const shapeToRemove = 'shape-2'
      const mockRef = {}
      const mockGroup: Group = {
        id: mockGroupId,
        name: 'Test Group',
        memberIds: mockShapeIds,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: mockUserId,
        zIndex: 0,
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroup,
      } as any)
      vi.mocked(update).mockResolvedValue(undefined)

      await syncRemoveFromGroup(mockCanvasId, mockGroupId, shapeToRemove)

      expect(update).toHaveBeenCalledWith(mockRef, expect.objectContaining({
        memberIds: ['shape-1', 'shape-3'],
      }))
    })

    it('should delete group when less than 2 members remain', async () => {
      const mockGroupId = 'group-123'
      const mockRef = {}
      const mockGroup: Group = {
        id: mockGroupId,
        name: 'Test Group',
        memberIds: ['shape-1', 'shape-2'], // Only 2 members
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: mockUserId,
        zIndex: 0,
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroup,
      } as any)
      vi.mocked(remove).mockResolvedValue(undefined)

      await syncRemoveFromGroup(mockCanvasId, mockGroupId, 'shape-2')

      expect(remove).toHaveBeenCalledWith(mockRef)
      expect(update).not.toHaveBeenCalled()
    })
  })

  describe('syncGetGroups', () => {
    it('should return all groups for a canvas', async () => {
      const mockRef = {}
      const mockGroupsData = {
        'group-1': {
          id: 'group-1',
          name: 'Group 1',
          memberIds: ['shape-1', 'shape-2'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: mockUserId,
          zIndex: 0,
        },
        'group-2': {
          id: 'group-2',
          name: 'Group 2',
          memberIds: ['shape-3', 'shape-4'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: mockUserId,
          zIndex: 0,
        },
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroupsData,
      } as any)

      const groups = await syncGetGroups(mockCanvasId)

      expect(groups).toHaveLength(2)
      expect(groups[0].id).toBe('group-1')
      expect(groups[1].id).toBe('group-2')
    })

    it('should return empty array when no groups exist', async () => {
      const mockRef = {}

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => false,
      } as any)

      const groups = await syncGetGroups(mockCanvasId)

      expect(groups).toEqual([])
    })
  })

  describe('syncGetGroup', () => {
    it('should return group by ID', async () => {
      const mockGroupId = 'group-123'
      const mockRef = {}
      const mockGroup: Group = {
        id: mockGroupId,
        name: 'Test Group',
        memberIds: mockShapeIds,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: mockUserId,
        zIndex: 0,
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroup,
      } as any)

      const group = await syncGetGroup(mockCanvasId, mockGroupId)

      expect(group).toEqual(mockGroup)
    })

    it('should return null when group not found', async () => {
      const mockGroupId = 'nonexistent-group'
      const mockRef = {}

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => false,
      } as any)

      const group = await syncGetGroup(mockCanvasId, mockGroupId)

      expect(group).toBeNull()
    })
  })

  describe('syncIsInGroup', () => {
    it('should return group ID if shape is in a group', async () => {
      const mockRef = {}
      const mockGroupsData = {
        'group-1': {
          id: 'group-1',
          name: 'Group 1',
          memberIds: ['shape-1', 'shape-2'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: mockUserId,
          zIndex: 0,
        },
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroupsData,
      } as any)

      const groupId = await syncIsInGroup(mockCanvasId, 'shape-2')

      expect(groupId).toBe('group-1')
    })

    it('should return null if shape is not in any group', async () => {
      const mockRef = {}
      const mockGroupsData = {
        'group-1': {
          id: 'group-1',
          name: 'Group 1',
          memberIds: ['shape-1', 'shape-2'],
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: mockUserId,
          zIndex: 0,
        },
      }

      vi.mocked(ref).mockReturnValue(mockRef as any)
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockGroupsData,
      } as any)

      const groupId = await syncIsInGroup(mockCanvasId, 'shape-99')

      expect(groupId).toBeNull()
    })
  })
})

