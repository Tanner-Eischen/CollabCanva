/**
 * Integration Tests for Freehand Drawing (PR-21)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvas } from '../../src/hooks/useCanvas'

// Mock Firebase
vi.mock('../../src/services/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-123' },
  },
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(() => Promise.resolve({ exists: () => false })),
  remove: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: 'test-user-123', email: 'test@example.com' })
    return () => {}
  }),
}))

describe('Drawing Integration Tests', () => {
  const mockCanvasId = 'test-canvas-123'
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Path Creation', () => {
    it('should create a path with addPath function', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      let pathId: string | null = null

      await act(async () => {
        const points = [0, 0, 10, 10, 20, 20, 30, 30]
        pathId = result.current.addPath(points, 0)
      })

      expect(pathId).toBeTruthy()
      expect(result.current.shapes).toHaveLength(1)
      expect(result.current.shapes[0].type).toBe('path')
      expect(result.current.shapes[0].points).toBeDefined()
    })

    it('should create sharp path with pencil (tension 0)', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      await act(async () => {
        const points = [0, 0, 10, 10, 20, 20]
        result.current.addPath(points, 0) // Pencil: tension = 0
      })

      const path = result.current.shapes[0]
      expect(path.tension).toBe(0)
    })

    it('should create smooth path with pen (tension 0.5)', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      await act(async () => {
        const points = [0, 0, 10, 10, 20, 20]
        result.current.addPath(points, 0.5) // Pen: tension = 0.5
      })

      const path = result.current.shapes[0]
      expect(path.tension).toBe(0.5)
    })

    it('should set default stroke color and width', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      await act(async () => {
        const points = [0, 0, 10, 10]
        result.current.addPath(points)
      })

      const path = result.current.shapes[0]
      expect(path.stroke).toBeDefined()
      expect(path.strokeWidth).toBeDefined()
      expect(path.fill).toBe('transparent')
    })

    it('should allow custom stroke color and width', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      await act(async () => {
        const points = [0, 0, 10, 10]
        result.current.addPath(points, 0, '#FF0000', 5)
      })

      const path = result.current.shapes[0]
      expect(path.stroke).toBe('#FF0000')
      expect(path.strokeWidth).toBe(5)
    })
  })

  describe('Path Properties', () => {
    it('should set closed to false by default', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      await act(async () => {
        const points = [0, 0, 10, 10, 20, 20]
        result.current.addPath(points)
      })

      const path = result.current.shapes[0]
      expect(path.closed).toBe(false)
    })

    it('should have transparent fill', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      await act(async () => {
        const points = [0, 0, 10, 10]
        result.current.addPath(points)
      })

      const path = result.current.shapes[0]
      expect(path.fill).toBe('transparent')
    })

    it('should set z-index to current timestamp', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      const beforeTime = Date.now()

      await act(async () => {
        const points = [0, 0, 10, 10]
        result.current.addPath(points)
      })

      const afterTime = Date.now()
      const path = result.current.shapes[0]
      
      expect(path.zIndex).toBeGreaterThanOrEqual(beforeTime)
      expect(path.zIndex).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('Path Interaction', () => {
    it('should allow path to be selected', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      let pathId: string

      await act(async () => {
        const points = [0, 0, 10, 10]
        pathId = result.current.addPath(points)
      })

      await act(async () => {
        result.current.setSelection(pathId)
      })

      expect(result.current.selectedId).toBe(pathId)
      expect(result.current.selectedIds.has(pathId)).toBe(true)
    })

    it('should allow path to be deleted', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      let pathId: string

      await act(async () => {
        const points = [0, 0, 10, 10]
        pathId = result.current.addPath(points)
      })

      expect(result.current.shapes).toHaveLength(1)

      await act(async () => {
        result.current.deleteShape(pathId)
      })

      expect(result.current.shapes).toHaveLength(0)
    })

    it('should allow path to be included in multi-select', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      let pathId: string
      let rectId: string

      await act(async () => {
        const points = [0, 0, 10, 10]
        pathId = result.current.addPath(points)
        rectId = result.current.addShape('rectangle', 100, 100)
      })

      await act(async () => {
        result.current.selectMultiple([pathId, rectId])
      })

      expect(result.current.selectedIds.size).toBe(2)
      expect(result.current.selectedIds.has(pathId)).toBe(true)
      expect(result.current.selectedIds.has(rectId)).toBe(true)
    })
  })

  describe('Path with Many Points', () => {
    it('should handle paths with many points (pencil tool)', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      // Generate many points like a freehand pencil would
      const points: number[] = []
      for (let i = 0; i < 100; i++) {
        points.push(i, i * 0.5)
      }

      await act(async () => {
        result.current.addPath(points, 0)
      })

      const path = result.current.shapes[0]
      expect(path.type).toBe('path')
      expect(path.points?.length).toBeGreaterThan(0)
    })

    it('should handle paths with fewer points (pen tool)', async () => {
      const { result } = renderHook(() =>
        useCanvas({
          canvasId: mockCanvasId,
          userId: mockUserId,
          enableSync: false,
        })
      )

      // Fewer points like a pen tool would create
      const points = [0, 0, 20, 20, 40, 40, 60, 60]

      await act(async () => {
        result.current.addPath(points, 0.5)
      })

      const path = result.current.shapes[0]
      expect(path.type).toBe('path')
      expect(path.points).toEqual(points)
      expect(path.tension).toBe(0.5)
    })
  })
})

