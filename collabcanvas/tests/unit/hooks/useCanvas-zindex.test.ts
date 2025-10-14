// Unit tests for Z-Index operations in useCanvas hook (PR-17)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvas } from '../../../src/hooks/useCanvas'
import type { Shape } from '../../../src/types/canvas'

// Mock Firebase services
vi.mock('../../../src/services/canvasSync', () => ({
  syncCreateShape: vi.fn().mockResolvedValue(undefined),
  syncUpdateShape: vi.fn().mockResolvedValue(undefined),
  syncDeleteShape: vi.fn().mockResolvedValue(undefined),
  syncBulkMove: vi.fn().mockResolvedValue(undefined),
  syncBulkDelete: vi.fn().mockResolvedValue(undefined),
  syncBatchCreate: vi.fn().mockResolvedValue(undefined),
  syncZIndex: vi.fn().mockResolvedValue(undefined),
  subscribeToCanvas: vi.fn().mockReturnValue(() => {}),
}))

vi.mock('../../../src/services/clipboard', () => ({
  copyShapes: vi.fn(),
  pasteShapes: vi.fn().mockReturnValue([]),
  duplicateShapes: vi.fn().mockReturnValue([]),
}))

vi.mock('../../../src/services/commandHistory', () => ({
  createHistoryManager: vi.fn().mockReturnValue({
    executeCommand: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: vi.fn().mockReturnValue(false),
    canRedo: vi.fn().mockReturnValue(false),
    clear: vi.fn(),
  }),
}))

vi.mock('../../../src/services/colorStorage', () => ({
  loadRecentColors: vi.fn().mockReturnValue([]),
  saveRecentColors: vi.fn(),
}))

describe('useCanvas - Z-Index Operations (PR-17)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sortShapesByZIndex', () => {
    it('should return shapes sorted by z-index (lowest first)', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes with different z-indices
      act(() => {
        result.current.addShape('rectangle', 100, 100) // z-index will be Date.now()
      })
      act(() => {
        result.current.addShape('circle', 200, 200) // z-index will be Date.now() + delta
      })
      act(() => {
        result.current.addShape('rectangle', 300, 300) // z-index will be Date.now() + delta
      })

      // Get sorted shapes
      const sortedShapes = result.current.sortShapesByZIndex()

      // Verify shapes are sorted by z-index in ascending order
      expect(sortedShapes).toHaveLength(3)
      for (let i = 0; i < sortedShapes.length - 1; i++) {
        const currentZ = sortedShapes[i].zIndex ?? 0
        const nextZ = sortedShapes[i + 1].zIndex ?? 0
        expect(currentZ).toBeLessThanOrEqual(nextZ)
      }
    })

    it('should handle shapes with undefined z-index', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add a shape
      act(() => {
        result.current.addShape('rectangle', 100, 100)
      })

      // Manually update a shape to have undefined z-index
      const shapes = result.current.shapes
      if (shapes.length > 0) {
        act(() => {
          result.current.updateShape(shapes[0].id, { zIndex: undefined })
        })
      }

      // Should not throw
      const sortedShapes = result.current.sortShapesByZIndex()
      expect(sortedShapes).toBeDefined()
    })
  })

  describe('bringToFront', () => {
    it('should set z-index to max+1 for selected shape', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add multiple shapes
      let shape1Id: string, shape2Id: string, shape3Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
        shape3Id = result.current.addShape('rectangle', 300, 300)
      })

      // Select first shape (which should have lowest z-index)
      act(() => {
        result.current.setSelection(shape1Id!)
      })

      // Get max z-index before operation
      const maxZBefore = Math.max(...result.current.shapes.map(s => s.zIndex ?? 0))

      // Bring to front
      act(() => {
        result.current.bringToFront()
      })

      // Verify the shape's z-index is now greater than the previous max
      const updatedShape = result.current.shapes.find(s => s.id === shape1Id)
      expect(updatedShape?.zIndex).toBeGreaterThan(maxZBefore)
    })

    it('should maintain relative order for multiple selected shapes', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes
      let shape1Id: string, shape2Id: string, shape3Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
        shape3Id = result.current.addShape('rectangle', 300, 300)
      })

      // Select first two shapes
      act(() => {
        result.current.selectMultiple([shape1Id!, shape2Id!])
      })

      // Bring to front
      act(() => {
        result.current.bringToFront()
      })

      // Get updated shapes
      const updatedShape1 = result.current.shapes.find(s => s.id === shape1Id)
      const updatedShape2 = result.current.shapes.find(s => s.id === shape2Id)
      const updatedShape3 = result.current.shapes.find(s => s.id === shape3Id)

      // Both selected shapes should be at the top, maintaining relative order
      expect(updatedShape1!.zIndex!).toBeGreaterThan(updatedShape3!.zIndex!)
      expect(updatedShape2!.zIndex!).toBeGreaterThan(updatedShape3!.zIndex!)
      expect(updatedShape2!.zIndex!).toBeGreaterThan(updatedShape1!.zIndex!)
    })
  })

  describe('sendToBack', () => {
    it('should set z-index to min-1 for selected shape', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add multiple shapes
      let shape1Id: string, shape2Id: string, shape3Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
        shape3Id = result.current.addShape('rectangle', 300, 300)
      })

      // Select last shape (which should have highest z-index)
      act(() => {
        result.current.setSelection(shape3Id!)
      })

      // Get min z-index before operation
      const minZBefore = Math.min(...result.current.shapes.map(s => s.zIndex ?? 0))

      // Send to back
      act(() => {
        result.current.sendToBack()
      })

      // Verify the shape's z-index is now less than the previous min
      const updatedShape = result.current.shapes.find(s => s.id === shape3Id)
      expect(updatedShape?.zIndex).toBeLessThan(minZBefore)
    })

    it('should maintain relative order for multiple selected shapes', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes
      let shape1Id: string, shape2Id: string, shape3Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
        shape3Id = result.current.addShape('rectangle', 300, 300)
      })

      // Select last two shapes
      act(() => {
        result.current.selectMultiple([shape2Id!, shape3Id!])
      })

      // Send to back
      act(() => {
        result.current.sendToBack()
      })

      // Get updated shapes
      const updatedShape1 = result.current.shapes.find(s => s.id === shape1Id)
      const updatedShape2 = result.current.shapes.find(s => s.id === shape2Id)
      const updatedShape3 = result.current.shapes.find(s => s.id === shape3Id)

      // Both selected shapes should be at the bottom, maintaining relative order
      expect(updatedShape2!.zIndex!).toBeLessThan(updatedShape1!.zIndex!)
      expect(updatedShape3!.zIndex!).toBeLessThan(updatedShape1!.zIndex!)
      expect(updatedShape3!.zIndex!).toBeGreaterThan(updatedShape2!.zIndex!)
    })
  })

  describe('bringForward', () => {
    it('should increment z-index by swapping with shape above', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes
      let shape1Id: string, shape2Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
      })

      // Select first shape
      act(() => {
        result.current.setSelection(shape1Id!)
      })

      const shape1Before = result.current.shapes.find(s => s.id === shape1Id)
      const shape2Before = result.current.shapes.find(s => s.id === shape2Id)

      // Bring forward
      act(() => {
        result.current.bringForward()
      })

      const shape1After = result.current.shapes.find(s => s.id === shape1Id)
      const shape2After = result.current.shapes.find(s => s.id === shape2Id)

      // The two shapes should have swapped z-indices
      expect(shape1After!.zIndex).toBe(shape2Before!.zIndex)
      expect(shape2After!.zIndex).toBe(shape1Before!.zIndex)
    })

    it('should do nothing if shape is already at the top', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes
      let shape1Id: string, shape2Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
      })

      // Select last shape (already at top)
      act(() => {
        result.current.setSelection(shape2Id!)
      })

      const zIndexBefore = result.current.shapes.find(s => s.id === shape2Id)?.zIndex

      // Try to bring forward
      act(() => {
        result.current.bringForward()
      })

      const zIndexAfter = result.current.shapes.find(s => s.id === shape2Id)?.zIndex

      // Z-index should remain the same
      expect(zIndexAfter).toBe(zIndexBefore)
    })
  })

  describe('sendBackward', () => {
    it('should decrement z-index by swapping with shape below', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes
      let shape1Id: string, shape2Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
      })

      // Select second shape
      act(() => {
        result.current.setSelection(shape2Id!)
      })

      const shape1Before = result.current.shapes.find(s => s.id === shape1Id)
      const shape2Before = result.current.shapes.find(s => s.id === shape2Id)

      // Send backward
      act(() => {
        result.current.sendBackward()
      })

      const shape1After = result.current.shapes.find(s => s.id === shape1Id)
      const shape2After = result.current.shapes.find(s => s.id === shape2Id)

      // The two shapes should have swapped z-indices
      expect(shape1After!.zIndex).toBe(shape2Before!.zIndex)
      expect(shape2After!.zIndex).toBe(shape1Before!.zIndex)
    })

    it('should do nothing if shape is already at the bottom', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes
      let shape1Id: string, shape2Id: string
      act(() => {
        shape1Id = result.current.addShape('rectangle', 100, 100)
        shape2Id = result.current.addShape('circle', 200, 200)
      })

      // Select first shape (already at bottom)
      act(() => {
        result.current.setSelection(shape1Id!)
      })

      const zIndexBefore = result.current.shapes.find(s => s.id === shape1Id)?.zIndex

      // Try to send backward
      act(() => {
        result.current.sendBackward()
      })

      const zIndexAfter = result.current.shapes.find(s => s.id === shape1Id)?.zIndex

      // Z-index should remain the same
      expect(zIndexAfter).toBe(zIndexBefore)
    })
  })

  describe('Edge cases', () => {
    it('should handle z-index operations with no selection', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      // Add shapes but don't select any
      act(() => {
        result.current.addShape('rectangle', 100, 100)
      })

      // These should not throw
      act(() => {
        result.current.bringToFront()
        result.current.sendToBack()
        result.current.bringForward()
        result.current.sendBackward()
      })

      // Shapes should be unchanged
      expect(result.current.shapes).toHaveLength(1)
    })

    it('should handle z-index operations with single shape', () => {
      const { result } = renderHook(() =>
        useCanvas({ canvasId: 'test-canvas', userId: 'user-1', enableSync: false })
      )

      let shapeId: string
      act(() => {
        shapeId = result.current.addShape('rectangle', 100, 100)
        result.current.setSelection(shapeId)
      })

      const zIndexBefore = result.current.shapes[0].zIndex

      // Try all operations - they should work but not change much
      act(() => {
        result.current.bringToFront()
      })
      expect(result.current.shapes[0].zIndex).toBeGreaterThanOrEqual(zIndexBefore!)

      act(() => {
        result.current.sendToBack()
      })
      // Z-index may change but shape is still the only one
      expect(result.current.shapes).toHaveLength(1)
    })
  })
})


