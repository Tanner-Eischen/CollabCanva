/**
 * Unit Tests for useLayers Hook (PR-19)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLayers } from '../../../src/hooks/useLayers'
import type { Shape } from '../../../src/types/canvas'

// Mock Firebase
vi.mock('../../../src/services/firebase', () => ({
  db: {},
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
}))

import { onValue, update } from 'firebase/database'

describe('useLayers Hook', () => {
  const mockCanvasId = 'test-canvas-123'

  const mockShapes: Shape[] = [
    {
      id: 'shape-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: '#3B82F6',
      zIndex: 0,
    },
    {
      id: 'shape-2',
      type: 'circle',
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      fill: '#3B82F6',
      zIndex: 1,
    },
    {
      id: 'shape-3',
      type: 'rectangle',
      x: 400,
      y: 400,
      width: 100,
      height: 100,
      fill: '#3B82F6',
      zIndex: 2,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization and Firebase sync', () => {
    it('should initialize with empty visibility and locks', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      expect(result.current.visibility).toEqual({})
      expect(result.current.locks).toEqual({})
    })

    it('should subscribe to Firebase on mount', () => {
      const { unmount } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      expect(onValue).toHaveBeenCalled()
      unmount()
    })

    it('should update visibility when Firebase data changes', async () => {
      let firebaseCallback: any

      vi.mocked(onValue).mockImplementation((ref, callback) => {
        // Store the first callback (visibility)
        if (!firebaseCallback) {
          firebaseCallback = callback
        }
      })

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      // Simulate Firebase update
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            'shape-1': false,
            'shape-2': true,
          }),
        })
      })

      await waitFor(() => {
        expect(result.current.visibility['shape-1']).toBe(false)
        expect(result.current.visibility['shape-2']).toBe(true)
      })
    })

    it('should not subscribe to Firebase when sync is disabled', () => {
      renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: false,
        })
      )

      expect(onValue).not.toHaveBeenCalled()
    })
  })

  describe('toggleVisibility', () => {
    it('should toggle visibility to false', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.toggleVisibility('shape-1')
      })

      expect(update).toHaveBeenCalled()
    })

    it('should toggle visibility to true if already false', async () => {
      let firebaseCallback: any

      vi.mocked(onValue).mockImplementation((ref, callback) => {
        if (!firebaseCallback) {
          firebaseCallback = callback
        }
      })
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      // Set initial visibility to false
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            'shape-1': false,
          }),
        })
      })

      await waitFor(() => {
        expect(result.current.visibility['shape-1']).toBe(false)
      })

      // Toggle to true
      await act(async () => {
        await result.current.toggleVisibility('shape-1')
      })

      expect(update).toHaveBeenCalled()
    })
  })

  describe('toggleLock', () => {
    it('should toggle lock to true', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.toggleLock('shape-1')
      })

      expect(update).toHaveBeenCalled()
    })

    it('should toggle lock to false if already true', async () => {
      let locksCallback: any

      vi.mocked(onValue).mockImplementation((ref, callback) => {
        // Second callback is for locks
        if (locksCallback) {
          return
        }
        locksCallback = callback
      })
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      // Set initial lock to true
      act(() => {
        if (locksCallback) {
          locksCallback({
            exists: () => true,
            val: () => ({
              'shape-1': true,
            }),
          })
        }
      })

      await waitFor(() => {
        expect(result.current.locks['shape-1']).toBe(true)
      })

      // Toggle to false
      await act(async () => {
        await result.current.toggleLock('shape-1')
      })

      expect(update).toHaveBeenCalled()
    })
  })

  describe('setVisibility', () => {
    it('should set visibility to specific value', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.setVisibility('shape-1', false)
      })

      expect(update).toHaveBeenCalledWith(expect.anything(), { value: false })
    })
  })

  describe('setLock', () => {
    it('should set lock to specific value', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.setLock('shape-1', true)
      })

      expect(update).toHaveBeenCalledWith(expect.anything(), { value: true })
    })
  })

  describe('reorderLayers', () => {
    it('should update z-index when reordering', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.reorderLayers(0, 2, mockShapes)
      })

      expect(update).toHaveBeenCalled()
    })

    it('should not update if indices are the same', async () => {
      vi.mocked(onValue).mockImplementation(() => {})
      vi.mocked(update).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      await act(async () => {
        await result.current.reorderLayers(1, 1, mockShapes)
      })

      expect(update).not.toHaveBeenCalled()
    })
  })

  describe('isVisible', () => {
    it('should return true by default', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      expect(result.current.isVisible('shape-1')).toBe(true)
    })

    it('should return false if explicitly set', async () => {
      let firebaseCallback: any

      vi.mocked(onValue).mockImplementation((ref, callback) => {
        if (!firebaseCallback) {
          firebaseCallback = callback
        }
      })

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      // Set visibility to false
      act(() => {
        firebaseCallback({
          exists: () => true,
          val: () => ({
            'shape-1': false,
          }),
        })
      })

      await waitFor(() => {
        expect(result.current.isVisible('shape-1')).toBe(false)
      })
    })
  })

  describe('isLocked', () => {
    it('should return false by default', () => {
      vi.mocked(onValue).mockImplementation(() => {})

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      expect(result.current.isLocked('shape-1')).toBe(false)
    })

    it('should return true if explicitly set', async () => {
      let visibilityCallback: any
      let locksCallback: any

      vi.mocked(onValue).mockImplementation((ref, callback) => {
        if (!visibilityCallback) {
          visibilityCallback = callback
        } else if (!locksCallback) {
          locksCallback = callback
        }
      })

      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: true,
        })
      )

      // Set lock to true
      act(() => {
        if (locksCallback) {
          locksCallback({
            exists: () => true,
            val: () => ({
              'shape-1': true,
            }),
          })
        }
      })

      await waitFor(() => {
        expect(result.current.isLocked('shape-1')).toBe(true)
      })
    })
  })

  describe('local mode (sync disabled)', () => {
    it('should work without Firebase when sync is disabled', async () => {
      const { result } = renderHook(() =>
        useLayers({
          canvasId: mockCanvasId,
          enableSync: false,
        })
      )

      await act(async () => {
        await result.current.setVisibility('shape-1', false)
      })

      expect(result.current.visibility['shape-1']).toBe(false)
      expect(update).not.toHaveBeenCalled()
    })
  })
})

