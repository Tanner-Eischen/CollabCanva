import { describe, it, expect, beforeEach } from 'vitest'
import {
  copyShapes,
  pasteShapes,
  duplicateShapes,
  hasClipboardData,
  clearClipboard,
} from '../../../src/services/clipboard'
import type { Shape } from '../../../src/types/canvas'

describe('Clipboard Service', () => {
  beforeEach(() => {
    // Clear clipboard before each test
    clearClipboard()
  })

  describe('copyShapes', () => {
    it('should copy shapes to in-memory clipboard', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
        {
          id: 'shape-2',
          type: 'circle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)

      expect(hasClipboardData()).toBe(true)
    })

    it('should store deep clones to avoid reference issues', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)

      // Modify original
      shapes[0].x = 999

      // Paste should return original values, not modified
      const pasted = pasteShapes()
      expect(pasted[0].x).toBe(120) // 100 + 20 offset
    })

    it('should handle empty array', () => {
      copyShapes([])
      expect(hasClipboardData()).toBe(false)
    })
  })

  describe('pasteShapes', () => {
    it('should return empty array when clipboard is empty', () => {
      const result = pasteShapes()
      expect(result).toEqual([])
    })

    it('should return shapes with new UUIDs', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)
      const pasted = pasteShapes()

      expect(pasted[0].id).not.toBe('shape-1')
      expect(pasted[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    it('should offset positions by 20px', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)
      const pasted = pasteShapes()

      expect(pasted[0].x).toBe(120) // 100 + 20
      expect(pasted[0].y).toBe(220) // 200 + 20
    })

    it('should preserve all shape properties except id and position', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 150,
          height: 200,
          rotation: 45,
        },
      ]

      copyShapes(shapes)
      const pasted = pasteShapes()

      expect(pasted[0].type).toBe('rectangle')
      expect(pasted[0].width).toBe(150)
      expect(pasted[0].height).toBe(200)
      expect(pasted[0].rotation).toBe(45)
    })

    it('should preserve text content for text shapes', () => {
      const shapes: Shape[] = [
        {
          id: 'text-1',
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          height: 30,
          text: 'Hello World',
        },
      ]

      copyShapes(shapes)
      const pasted = pasteShapes()

      expect(pasted[0].text).toBe('Hello World')
    })

    it('should handle multi-select paste', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
        {
          id: 'shape-2',
          type: 'circle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
        },
        {
          id: 'text-1',
          type: 'text',
          x: 300,
          y: 300,
          width: 150,
          height: 30,
          text: 'Test',
        },
      ]

      copyShapes(shapes)
      const pasted = pasteShapes()

      expect(pasted).toHaveLength(3)
      expect(pasted[0].x).toBe(120)
      expect(pasted[1].x).toBe(220)
      expect(pasted[2].x).toBe(320)
    })

    it('should allow multiple pastes with same offset', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)
      const pasted1 = pasteShapes()
      const pasted2 = pasteShapes()

      // Both should have same offset from original
      expect(pasted1[0].x).toBe(120)
      expect(pasted2[0].x).toBe(120)
      // But different IDs
      expect(pasted1[0].id).not.toBe(pasted2[0].id)
    })
  })

  describe('duplicateShapes', () => {
    it('should return empty array for empty input', () => {
      const result = duplicateShapes([])
      expect(result).toEqual([])
    })

    it('should create duplicates with new UUIDs', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ]

      const duplicated = duplicateShapes(shapes)

      expect(duplicated[0].id).not.toBe('shape-1')
      expect(duplicated[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    it('should offset positions by 20px', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 100,
          height: 100,
        },
      ]

      const duplicated = duplicateShapes(shapes)

      expect(duplicated[0].x).toBe(120) // 100 + 20
      expect(duplicated[0].y).toBe(220) // 200 + 20
    })

    it('should preserve all shape properties', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'circle',
          x: 100,
          y: 100,
          width: 150,
          height: 200,
          rotation: 90,
        },
      ]

      const duplicated = duplicateShapes(shapes)

      expect(duplicated[0].type).toBe('circle')
      expect(duplicated[0].width).toBe(150)
      expect(duplicated[0].height).toBe(200)
      expect(duplicated[0].rotation).toBe(90)
    })

    it('should preserve text content', () => {
      const shapes: Shape[] = [
        {
          id: 'text-1',
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          height: 30,
          text: 'Duplicate me',
        },
      ]

      const duplicated = duplicateShapes(shapes)

      expect(duplicated[0].text).toBe('Duplicate me')
    })

    it('should handle multi-select duplication', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
        {
          id: 'shape-2',
          type: 'circle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
        },
      ]

      const duplicated = duplicateShapes(shapes)

      expect(duplicated).toHaveLength(2)
      expect(duplicated[0].x).toBe(120)
      expect(duplicated[1].x).toBe(220)
    })
  })

  describe('hasClipboardData', () => {
    it('should return false when clipboard is empty', () => {
      expect(hasClipboardData()).toBe(false)
    })

    it('should return true after copying shapes', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)
      expect(hasClipboardData()).toBe(true)
    })

    it('should return false after clearing clipboard', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)
      clearClipboard()
      expect(hasClipboardData()).toBe(false)
    })
  })

  describe('clearClipboard', () => {
    it('should clear clipboard data', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ]

      copyShapes(shapes)
      expect(hasClipboardData()).toBe(true)

      clearClipboard()
      expect(hasClipboardData()).toBe(false)
      expect(pasteShapes()).toEqual([])
    })

    it('should be safe to call on empty clipboard', () => {
      expect(() => clearClipboard()).not.toThrow()
    })
  })
})

