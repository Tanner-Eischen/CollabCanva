import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvas } from '../../../src/hooks/useCanvas'

describe('useCanvas hook', () => {
  it('should initialize with empty shapes array and no selection', () => {
    const { result } = renderHook(() => useCanvas())

    expect(result.current.shapes).toEqual([])
    expect(result.current.selectedId).toBeNull()
  })

  describe('addShape', () => {
    it('should create rectangle with w=100, h=100', () => {
      const { result } = renderHook(() => useCanvas())

      act(() => {
        result.current.addShape('rectangle', 50, 50)
      })

      expect(result.current.shapes).toHaveLength(1)
      expect(result.current.shapes[0]).toMatchObject({
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      })
      expect(result.current.shapes[0].id).toBeDefined()
    })

    it('should create circle with w=100, h=100 (diameter)', () => {
      const { result } = renderHook(() => useCanvas())

      act(() => {
        result.current.addShape('circle', 100, 100)
      })

      expect(result.current.shapes).toHaveLength(1)
      expect(result.current.shapes[0]).toMatchObject({
        type: 'circle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      })
      expect(result.current.shapes[0].id).toBeDefined()
    })

    it('should assign unique UUID to each shape', () => {
      const { result } = renderHook(() => useCanvas())

      let id1: string, id2: string

      act(() => {
        id1 = result.current.addShape('rectangle', 0, 0)
        id2 = result.current.addShape('circle', 0, 0)
      })

      expect(id1).not.toBe(id2)
      expect(result.current.shapes).toHaveLength(2)
      expect(result.current.shapes[0].id).toBe(id1)
      expect(result.current.shapes[1].id).toBe(id2)
    })

    it('should NOT store color property (all shapes are blue)', () => {
      const { result } = renderHook(() => useCanvas())

      act(() => {
        result.current.addShape('rectangle', 0, 0)
      })

      expect(result.current.shapes[0]).not.toHaveProperty('color')
    })
  })

  describe('addText', () => {
    it('should create text with content and calculated dimensions', () => {
      const { result } = renderHook(() => useCanvas())

      act(() => {
        result.current.addText('Hello', 50, 50)
      })

      expect(result.current.shapes).toHaveLength(1)
      expect(result.current.shapes[0]).toMatchObject({
        type: 'text',
        x: 50,
        y: 50,
        text: 'Hello',
      })
      expect(result.current.shapes[0].width).toBeGreaterThan(0)
      expect(result.current.shapes[0].height).toBeGreaterThan(0)
    })

    it('should validate text and reject empty string', () => {
      const { result } = renderHook(() => useCanvas())

      let id: string | null

      act(() => {
        id = result.current.addText('', 50, 50)
      })

      expect(id).toBeNull()
      expect(result.current.shapes).toHaveLength(0)
    })

    it('should validate text and reject whitespace-only string', () => {
      const { result } = renderHook(() => useCanvas())

      let id: string | null

      act(() => {
        id = result.current.addText('   ', 50, 50)
      })

      expect(id).toBeNull()
      expect(result.current.shapes).toHaveLength(0)
    })

    it('should assign unique UUID to text shape', () => {
      const { result } = renderHook(() => useCanvas())

      let id: string | null

      act(() => {
        id = result.current.addText('Test', 0, 0)
      })

      expect(id).toBeDefined()
      expect(result.current.shapes).toHaveLength(1)
      expect(result.current.shapes[0].id).toBe(id)
    })
  })

  describe('updateShape', () => {
    it('should update correct shape by id (position)', () => {
      const { result } = renderHook(() => useCanvas())

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
      })

      act(() => {
        result.current.updateShape(shapeId, { x: 100, y: 200 })
      })

      expect(result.current.shapes[0]).toMatchObject({
        id: shapeId,
        x: 100,
        y: 200,
      })
    })

    it('should not affect other shapes', () => {
      const { result } = renderHook(() => useCanvas())

      let id1: string, id2: string

      act(() => {
        id1 = result.current.addShape('rectangle', 10, 10)
        id2 = result.current.addShape('circle', 20, 20)
      })

      act(() => {
        result.current.updateShape(id1, { x: 100, y: 100 })
      })

      expect(result.current.shapes[0]).toMatchObject({
        id: id1,
        x: 100,
        y: 100,
      })
      expect(result.current.shapes[1]).toMatchObject({
        id: id2,
        x: 20,
        y: 20,
      })
    })
  })

  describe('deleteShape', () => {
    it('should remove shape from array', () => {
      const { result } = renderHook(() => useCanvas())

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
      })

      expect(result.current.shapes).toHaveLength(1)

      act(() => {
        result.current.deleteShape(shapeId)
      })

      expect(result.current.shapes).toHaveLength(0)
    })

    it('should clear selection if deleted shape was selected', () => {
      const { result } = renderHook(() => useCanvas())

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

    it('should not clear selection if deleted shape was not selected', () => {
      const { result } = renderHook(() => useCanvas())

      let id1: string, id2: string

      act(() => {
        id1 = result.current.addShape('rectangle', 0, 0)
        id2 = result.current.addShape('circle', 0, 0)
        result.current.setSelection(id1)
      })

      act(() => {
        result.current.deleteShape(id2)
      })

      expect(result.current.selectedId).toBe(id1)
      expect(result.current.shapes).toHaveLength(1)
    })
  })

  describe('setSelection', () => {
    it('should update selectedId', () => {
      const { result } = renderHook(() => useCanvas())

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
        result.current.setSelection(shapeId)
      })

      expect(result.current.selectedId).toBe(shapeId)
    })

    it('should allow clearing selection with null', () => {
      const { result } = renderHook(() => useCanvas())

      let shapeId: string

      act(() => {
        shapeId = result.current.addShape('rectangle', 0, 0)
        result.current.setSelection(shapeId)
      })

      expect(result.current.selectedId).toBe(shapeId)

      act(() => {
        result.current.setSelection(null)
      })

      expect(result.current.selectedId).toBeNull()
    })
  })

  describe('shapes array operations', () => {
    it('should maintain correct order after multiple operations', () => {
      const { result } = renderHook(() => useCanvas())

      let id1: string, id2: string, id3: string

      act(() => {
        id1 = result.current.addShape('rectangle', 0, 0)
        id2 = result.current.addShape('circle', 0, 0)
        id3 = result.current.addShape('rectangle', 0, 0)
      })

      expect(result.current.shapes).toHaveLength(3)
      expect(result.current.shapes[0].id).toBe(id1)
      expect(result.current.shapes[1].id).toBe(id2)
      expect(result.current.shapes[2].id).toBe(id3)

      act(() => {
        result.current.deleteShape(id2)
      })

      expect(result.current.shapes).toHaveLength(2)
      expect(result.current.shapes[0].id).toBe(id1)
      expect(result.current.shapes[1].id).toBe(id3)
    })
  })
})

