/**
 * Unit Tests for useGroups Hook (PR-19)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGroups } from '../../../src/hooks/useGroups'
import type { Group } from '../../../src/types/group'
import type { Shape } from '../../../src/types/canvas'

// Mock Firebase
vi.mock('../../../src/services/firebase', () => ({
  db: {},
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
}))

// Mock group sync service
vi.mock('../../../src/services/groupSync', () => ({
  syncCreateGroup: vi.fn(),
  syncUpdateGroup: vi.fn(),
  syncDeleteGroup: vi.fn(),
  syncAddToGroup: vi.fn(),
  syncRemoveFromGroup: vi.fn(),
}))

import {
  syncCreateGroup,
  syncUpdateGroup,
  syncDeleteGroup,
  syncAddToGroup,
  syncRemoveFromGroup,
} from '../../../src/services/groupSync'
import { onValue } from 'firebase/database'

describe('useGroups Hook', () => {
  const mockCanvasId = 'test-canvas-123'
  const mockUserId = 'user-123'

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
  ]

  const mockGroup: Group = {
    id: 'group-123',
    name: 'Test Group',
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
    createdBy: mockUserId,
    zIndex: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization and Firebase sync', () => {
    it('should initialize with empty groups', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      expect(result.current.groups).toEqual([])
    })

    it('should subscribe to Firebase groups on mount', () => {
      const { unmount } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      expect(onValue).toHaveBeenCalled()
      unmount()
    })

    it('should update groups when Firebase data changes', async () => {
      let firebaseCallback: any

      vi.mocked(onValue).mockImplementation((ref, callback) => {
        firebaseCallback = callback
      })

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      // Simulate Firebase update
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            [mockGroup.id]: mockGroup,
          }),
        })
      })

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(1)
        expect(result.current.groups[0].id).toBe(mockGroup.id)
      })
    })

    it('should not subscribe to Firebase when sync is disabled', () => {
      renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      expect(onValue).not.toHaveBeenCalled()
    })
  })

  describe('createGroup', () => {
    it('should create a group with 2+ shapes', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(syncCreateGroup).mockResolvedValue(mockGroup)

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      let groupId: string | null = null
      await act(async () => {
        groupId = await result.current.createGroup(['shape-1', 'shape-2'])
      })

      expect(syncCreateGroup).toHaveBeenCalledWith(
        mockCanvasId,
        ['shape-1', 'shape-2'],
        mockUserId,
        undefined
      )
      expect(groupId).toBe(mockGroup.id)
    })

    it('should create group with custom name', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(syncCreateGroup).mockResolvedValue(mockGroup)

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.createGroup(['shape-1', 'shape-2'], 'My Group')
      })

      expect(syncCreateGroup).toHaveBeenCalledWith(
        mockCanvasId,
        ['shape-1', 'shape-2'],
        mockUserId,
        'My Group'
      )
    })

    it('should not create group with less than 2 shapes', async () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      let groupId: string | null = null
      await act(async () => {
        groupId = await result.current.createGroup(['shape-1'])
      })

      expect(syncCreateGroup).not.toHaveBeenCalled()
      expect(groupId).toBeNull()
    })

    it('should handle errors during group creation', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(syncCreateGroup).mockRejectedValue(new Error('Firebase error'))

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      let groupId: string | null = null
      await act(async () => {
        groupId = await result.current.createGroup(['shape-1', 'shape-2'])
      })

      expect(groupId).toBeNull()
    })
  })

  describe('ungroup', () => {
    it('should delete group from Firebase', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(syncDeleteGroup).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.ungroup('group-123')
      })

      expect(syncDeleteGroup).toHaveBeenCalledWith(mockCanvasId, 'group-123')
    })

    it('should handle errors during ungroup', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(syncDeleteGroup).mockRejectedValue(new Error('Firebase error'))

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      await expect(
        act(async () => {
          await result.current.ungroup('group-123')
        })
      ).rejects.toThrow()
    })
  })

  describe('addToGroup', () => {
    it('should add shape to group', async () => {
      let firebaseCallback: any
      vi.mocked(onValue).mockImplementation((ref, callback) => {
        firebaseCallback = callback
      })
      vi.mocked(syncAddToGroup).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      // Initialize with existing group
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            [mockGroup.id]: mockGroup,
          }),
        })
      })

      await act(async () => {
        await result.current.addToGroup('group-123', 'shape-3')
      })

      expect(syncAddToGroup).toHaveBeenCalledWith(mockCanvasId, 'group-123', 'shape-3')
    })
  })

  describe('removeFromGroup', () => {
    it('should remove shape from group', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(syncRemoveFromGroup).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.removeFromGroup('group-123', 'shape-2')
      })

      expect(syncRemoveFromGroup).toHaveBeenCalledWith(mockCanvasId, 'group-123', 'shape-2')
    })
  })

  describe('updateGroup', () => {
    it('should update group properties', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(syncUpdateGroup).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      const updates = { name: 'Updated Name', locked: true }

      await act(async () => {
        await result.current.updateGroup('group-123', updates)
      })

      expect(syncUpdateGroup).toHaveBeenCalledWith(mockCanvasId, 'group-123', updates)
    })
  })

  describe('getGroupById', () => {
    it('should return group by ID', async () => {
      let firebaseCallback: any
      vi.mocked(onValue).mockImplementation((ref, callback) => {
        firebaseCallback = callback
      })

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      // Initialize with group
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            [mockGroup.id]: mockGroup,
          }),
        })
      })

      await waitFor(() => {
        const group = result.current.getGroupById(mockGroup.id)
        expect(group).toBeDefined()
        expect(group?.id).toBe(mockGroup.id)
      })
    })

    it('should return undefined for nonexistent group', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      const group = result.current.getGroupById('nonexistent')
      expect(group).toBeUndefined()
    })
  })

  describe('isShapeInGroup', () => {
    it('should return group ID if shape is in group', async () => {
      let firebaseCallback: any
      vi.mocked(onValue).mockImplementation((ref, callback) => {
        firebaseCallback = callback
      })

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      // Initialize with group
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            [mockGroup.id]: mockGroup,
          }),
        })
      })

      await waitFor(() => {
        const groupId = result.current.isShapeInGroup('shape-1')
        expect(groupId).toBe(mockGroup.id)
      })
    })

    it('should return null if shape is not in any group', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      const groupId = result.current.isShapeInGroup('shape-99')
      expect(groupId).toBeNull()
    })
  })

  describe('getGroupMembers', () => {
    it('should return all member IDs', async () => {
      let firebaseCallback: any
      vi.mocked(onValue).mockImplementation((ref, callback) => {
        firebaseCallback = callback
      })

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      // Initialize with group
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            [mockGroup.id]: mockGroup,
          }),
        })
      })

      await waitFor(() => {
        const members = result.current.getGroupMembers(mockGroup.id)
        expect(members).toEqual(['shape-1', 'shape-2'])
      })
    })

    it('should return empty array for nonexistent group', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      const members = result.current.getGroupMembers('nonexistent')
      expect(members).toEqual([])
    })
  })

  describe('calculateBounds', () => {
    it('should calculate group bounding box from member shapes', async () => {
      let firebaseCallback: any
      vi.mocked(onValue).mockImplementation((ref, callback) => {
        firebaseCallback = callback
      })

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      // Initialize with group
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            [mockGroup.id]: mockGroup,
          }),
        })
      })

      await waitFor(() => {
        const bounds = result.current.calculateBounds(mockGroup.id, mockShapes)
        expect(bounds).toBeDefined()
        expect(bounds?.x).toBe(0)
        expect(bounds?.y).toBe(0)
        expect(bounds?.width).toBe(300)
        expect(bounds?.height).toBe(300)
      })
    })

    it('should return null for nonexistent group', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useGroups({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: true,
        })
      )

      const bounds = result.current.calculateBounds('nonexistent', mockShapes)
      expect(bounds).toBeNull()
    })
  })
})

