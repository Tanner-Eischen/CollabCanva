import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCanvas } from '../../src/hooks/useCanvas'
import * as canvasSync from '../../src/services/canvasSync'
import type { Shape } from '../../src/types/canvas'

// Mock canvasSync service
vi.mock('../../src/services/canvasSync', () => ({
  syncCreateShape: vi.fn(),
  syncUpdateShape: vi.fn(),
  syncDeleteShape: vi.fn(),
  subscribeToCanvas: vi.fn(),
}))

describe('Real-Time Sync Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock for subscribeToCanvas
    vi.mocked(canvasSync.subscribeToCanvas).mockImplementation(() => {
      return () => {} // unsubscribe function
    })
  })

  describe('Shape Creation Sync', () => {
    it('should sync rectangle creation to Firebase', async () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      act(() => {
        result.current.addShape('rectangle', 100, 200)
      })

      await waitFor(() => {
        expect(canvasSync.syncCreateShape).toHaveBeenCalledTimes(1)
        expect(canvasSync.syncCreateShape).toHaveBeenCalledWith(
          'test-canvas',
          expect.any(String), // UUID
          expect.objectContaining({
            type: 'rectangle',
            x: 100,
            y: 200,
            width: 100,
            height: 100,
          })
        )
      })
    })

    it('should sync circle creation to Firebase', async () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      act(() => {
        result.current.addShape('circle', 150, 250)
      })

      await waitFor(() => {
        expect(canvasSync.syncCreateShape).toHaveBeenCalledWith(
          'test-canvas',
          expect.any(String),
          expect.objectContaining({
            type: 'circle',
            x: 150,
            y: 250,
            width: 100,
            height: 100,
          })
        )
      })
    })

    it('should sync text creation to Firebase', async () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      act(() => {
        result.current.addText('Hello World', 50, 75)
      })

      await waitFor(() => {
        expect(canvasSync.syncCreateShape).toHaveBeenCalledWith(
          'test-canvas',
          expect.any(String),
          expect.objectContaining({
            type: 'text',
            x: 50,
            y: 75,
            text: 'Hello World',
          })
        )
      })
    })

    it('should not sync when enableSync is false', () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: false,
        })
      )

      act(() => {
        result.current.addShape('rectangle', 100, 200)
      })

      expect(canvasSync.syncCreateShape).not.toHaveBeenCalled()
    })
  })

  describe('Shape Update Sync', () => {
    it('should sync position updates to Firebase', async () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)
      vi.mocked(canvasSync.syncUpdateShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
      })

      act(() => {
        result.current.updateShape(shapeId, { x: 250, y: 350 })
      })

      await waitFor(() => {
        expect(canvasSync.syncUpdateShape).toHaveBeenCalledWith(
          'test-canvas',
          shapeId,
          { x: 250, y: 350 }
        )
      })
    })

    it('should not sync updates when enableSync is false', () => {
      vi.mocked(canvasSync.syncUpdateShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: false,
        })
      )

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
      })

      act(() => {
        result.current.updateShape(shapeId, { x: 100, y: 200 })
      })

      expect(canvasSync.syncUpdateShape).not.toHaveBeenCalled()
    })
  })

  describe('Shape Deletion Sync', () => {
    it('should sync deletion to Firebase', async () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)
      vi.mocked(canvasSync.syncDeleteShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
      })

      act(() => {
        result.current.deleteShape(shapeId)
      })

      await waitFor(() => {
        expect(canvasSync.syncDeleteShape).toHaveBeenCalledWith(
          'test-canvas',
          shapeId
        )
      })
    })

    it('should clear selection when deleting selected shape', () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)
      vi.mocked(canvasSync.syncDeleteShape).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
        result.current.setSelection(shapeId)
      })

      expect(result.current.selectedId).toBe(shapeId)

      act(() => {
        result.current.deleteShape(shapeId)
      })

      expect(result.current.selectedId).toBeNull()
    })
  })

  describe('Firebase Subscription', () => {
    it('should subscribe to canvas updates', () => {
      renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      expect(canvasSync.subscribeToCanvas).toHaveBeenCalledWith(
        'test-canvas',
        expect.objectContaining({
          onCreate: expect.any(Function),
          onUpdate: expect.any(Function),
          onDelete: expect.any(Function),
        })
      )
    })

    it('should not subscribe when enableSync is false', () => {
      renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: false,
        })
      )

      expect(canvasSync.subscribeToCanvas).not.toHaveBeenCalled()
    })

    it('should handle onCreate callback from Firebase', () => {
      let createCallback: ((shape: Shape) => void) | undefined

      vi.mocked(canvasSync.subscribeToCanvas).mockImplementation(
        (canvasId, callbacks) => {
          createCallback = callbacks.onCreate
          return () => {}
        }
      )

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      expect(createCallback).toBeDefined()

      // Simulate Firebase onCreate event
      act(() => {
        createCallback!({
          id: 'remote-shape-1',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 100,
          height: 100,
        })
      })

      expect(result.current.shapes).toHaveLength(1)
      expect(result.current.shapes[0]).toMatchObject({
        id: 'remote-shape-1',
        type: 'rectangle',
        x: 100,
        y: 200,
      })
    })

    it('should handle onUpdate callback from Firebase', () => {
      let createCallback: ((shape: Shape) => void) | undefined
      let updateCallback:
        | ((shapeId: string, updates: Partial<Shape>) => void)
        | undefined

      vi.mocked(canvasSync.subscribeToCanvas).mockImplementation(
        (canvasId, callbacks) => {
          createCallback = callbacks.onCreate
          updateCallback = callbacks.onUpdate
          return () => {}
        }
      )

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      // Create a shape first
      act(() => {
        createCallback!({
          id: 'remote-shape-1',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 100,
          height: 100,
        })
      })

      // Update the shape
      act(() => {
        updateCallback!('remote-shape-1', { x: 300, y: 400 })
      })

      expect(result.current.shapes[0]).toMatchObject({
        id: 'remote-shape-1',
        x: 300,
        y: 400,
      })
    })

    it('should handle onDelete callback from Firebase', () => {
      let createCallback: ((shape: Shape) => void) | undefined
      let deleteCallback: ((shapeId: string) => void) | undefined

      vi.mocked(canvasSync.subscribeToCanvas).mockImplementation(
        (canvasId, callbacks) => {
          createCallback = callbacks.onCreate
          deleteCallback = callbacks.onDelete
          return () => {}
        }
      )

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      // Create a shape first
      act(() => {
        createCallback!({
          id: 'remote-shape-1',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 100,
          height: 100,
        })
      })

      expect(result.current.shapes).toHaveLength(1)

      // Delete the shape
      act(() => {
        deleteCallback!('remote-shape-1')
      })

      expect(result.current.shapes).toHaveLength(0)
    })

    it('should not create duplicates from Firebase onCreate', () => {
      vi.mocked(canvasSync.syncCreateShape).mockResolvedValue(undefined)

      let createCallback: ((shape: Shape) => void) | undefined

      vi.mocked(canvasSync.subscribeToCanvas).mockImplementation(
        (canvasId, callbacks) => {
          createCallback = callbacks.onCreate
          return () => {}
        }
      )

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      // Create shape locally
      let shapeId: string
      act(() => {
        shapeId = result.current.addShape('rectangle', 100, 200)
      })

      // Simulate Firebase echoing back the same shape
      act(() => {
        createCallback!({
          id: shapeId,
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 100,
          height: 100,
        })
      })

      // Should still only have 1 shape, not 2
      expect(result.current.shapes).toHaveLength(1)
    })

    it('should unsubscribe on unmount', () => {
      const unsubscribe = vi.fn()
      vi.mocked(canvasSync.subscribeToCanvas).mockReturnValue(unsubscribe)

      const { unmount } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Multi-User Scenarios', () => {
    it('should handle shapes from multiple users', () => {
      let createCallback: ((shape: Shape) => void) | undefined

      vi.mocked(canvasSync.subscribeToCanvas).mockImplementation(
        (canvasId, callbacks) => {
          createCallback = callbacks.onCreate
          return () => {}
        }
      )

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      // User 2 creates a shape
      act(() => {
        createCallback!({
          id: 'user2-shape-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        })
      })

      // User 3 creates a shape
      act(() => {
        createCallback!({
          id: 'user3-shape-1',
          type: 'circle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
        })
      })

      expect(result.current.shapes).toHaveLength(2)
    })

    it('should clear selection when another user deletes selected shape', () => {
      let createCallback: ((shape: Shape) => void) | undefined
      let deleteCallback: ((shapeId: string) => void) | undefined

      vi.mocked(canvasSync.subscribeToCanvas).mockImplementation(
        (canvasId, callbacks) => {
          createCallback = callbacks.onCreate
          deleteCallback = callbacks.onDelete
          return () => {}
        }
      )

      const { result } = renderHook(() =>
        useCanvas({
          canvasId: 'test-canvas',
          userId: 'user-1',
          enableSync: true,
        })
      )

      // Create and select a shape
      act(() => {
        createCallback!({
          id: 'shared-shape',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 100,
          height: 100,
        })
      })

      act(() => {
        result.current.setSelection('shared-shape')
      })

      expect(result.current.selectedId).toBe('shared-shape')

      // Another user deletes it
      act(() => {
        deleteCallback!('shared-shape')
      })

      expect(result.current.selectedId).toBeNull()
    })
  })
})

