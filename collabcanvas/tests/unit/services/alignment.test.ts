// Unit tests for Alignment Service (PR-18)

import { describe, it, expect } from 'vitest'
import {
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
  centerInCanvas,
} from '../../../src/services/alignment'
import type { Shape } from '../../../src/types/canvas'

// Helper to create test shapes
function createTestShape(id: string, x: number, y: number, width: number = 100, height: number = 100): Shape {
  return {
    id,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill: '#3B82F6FF',
    zIndex: Date.now(),
  }
}

describe('Alignment Service (PR-18)', () => {
  describe('alignLeft', () => {
    it('should align all shapes to the leftmost edge', () => {
      const shapes: Shape[] = [
        createTestShape('1', 100, 50),
        createTestShape('2', 200, 100),
        createTestShape('3', 50, 150), // leftmost
      ]

      const result = alignLeft(shapes)

      expect(result['1'].x).toBe(50)
      expect(result['2'].x).toBe(50)
      expect(result['3'].x).toBe(50)
      // Y coordinates should remain unchanged
      expect(result['1'].y).toBe(50)
      expect(result['2'].y).toBe(100)
      expect(result['3'].y).toBe(150)
    })

    it('should return empty object for single shape', () => {
      const shapes: Shape[] = [createTestShape('1', 100, 50)]
      const result = alignLeft(shapes)
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('alignCenter', () => {
    it('should align shapes to average horizontal center', () => {
      const shapes: Shape[] = [
        createTestShape('1', 0, 50, 100, 100),   // center at 50
        createTestShape('2', 100, 100, 100, 100), // center at 150
        createTestShape('3', 200, 150, 100, 100), // center at 250
      ]

      const result = alignCenter(shapes)

      // Average center x = (50 + 150 + 250) / 3 = 150
      // Each shape should be positioned so its center is at 150
      expect(result['1'].x).toBe(100) // 150 - 50
      expect(result['2'].x).toBe(100) // 150 - 50
      expect(result['3'].x).toBe(100) // 150 - 50
    })
  })

  describe('alignRight', () => {
    it('should align all shapes to the rightmost edge', () => {
      const shapes: Shape[] = [
        createTestShape('1', 100, 50, 100, 100),  // right at 200
        createTestShape('2', 200, 100, 100, 100), // right at 300 (rightmost)
        createTestShape('3', 50, 150, 100, 100),  // right at 150
      ]

      const result = alignRight(shapes)

      // All shapes should have right edge at 300
      expect(result['1'].x).toBe(200) // 300 - 100
      expect(result['2'].x).toBe(200) // 300 - 100
      expect(result['3'].x).toBe(200) // 300 - 100
    })
  })

  describe('alignTop', () => {
    it('should align all shapes to the topmost edge', () => {
      const shapes: Shape[] = [
        createTestShape('1', 50, 100),
        createTestShape('2', 100, 50), // topmost
        createTestShape('3', 150, 150),
      ]

      const result = alignTop(shapes)

      expect(result['1'].y).toBe(50)
      expect(result['2'].y).toBe(50)
      expect(result['3'].y).toBe(50)
      // X coordinates should remain unchanged
      expect(result['1'].x).toBe(50)
      expect(result['2'].x).toBe(100)
      expect(result['3'].x).toBe(150)
    })
  })

  describe('alignMiddle', () => {
    it('should align shapes to average vertical middle', () => {
      const shapes: Shape[] = [
        createTestShape('1', 50, 0, 100, 100),   // middle at 50
        createTestShape('2', 100, 100, 100, 100), // middle at 150
        createTestShape('3', 150, 200, 100, 100), // middle at 250
      ]

      const result = alignMiddle(shapes)

      // Average middle y = (50 + 150 + 250) / 3 = 150
      // Each shape should be positioned so its middle is at 150
      expect(result['1'].y).toBe(100) // 150 - 50
      expect(result['2'].y).toBe(100) // 150 - 50
      expect(result['3'].y).toBe(100) // 150 - 50
    })
  })

  describe('alignBottom', () => {
    it('should align all shapes to the bottommost edge', () => {
      const shapes: Shape[] = [
        createTestShape('1', 50, 100, 100, 100),  // bottom at 200
        createTestShape('2', 100, 200, 100, 100), // bottom at 300 (bottommost)
        createTestShape('3', 150, 50, 100, 100),  // bottom at 150
      ]

      const result = alignBottom(shapes)

      // All shapes should have bottom edge at 300
      expect(result['1'].y).toBe(200) // 300 - 100
      expect(result['2'].y).toBe(200) // 300 - 100
      expect(result['3'].y).toBe(200) // 300 - 100
    })
  })

  describe('distributeHorizontally', () => {
    it('should distribute shapes with equal horizontal spacing', () => {
      const shapes: Shape[] = [
        createTestShape('1', 0, 0, 50, 50),     // left at 0
        createTestShape('2', 100, 0, 50, 50),   // middle (should move)
        createTestShape('3', 300, 0, 50, 50),   // right at 300
      ]

      const result = distributeHorizontally(shapes)

      // Total width: 50 + 50 + 50 = 150
      // Total space: 350 - 0 - 150 = 200
      // Spacing: 200 / 2 = 100
      // Middle shape should be at: 0 + 50 + 100 = 150
      expect(result['2'].x).toBe(150)
      // First and last shapes should not move
      expect(result['1']).toBeUndefined()
      expect(result['3']).toBeUndefined()
    })

    it('should return empty object for less than 3 shapes', () => {
      const shapes: Shape[] = [
        createTestShape('1', 0, 0),
        createTestShape('2', 100, 0),
      ]
      const result = distributeHorizontally(shapes)
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('distributeVertically', () => {
    it('should distribute shapes with equal vertical spacing', () => {
      const shapes: Shape[] = [
        createTestShape('1', 0, 0, 50, 50),     // top at 0
        createTestShape('2', 0, 100, 50, 50),   // middle (should move)
        createTestShape('3', 0, 300, 50, 50),   // bottom at 300
      ]

      const result = distributeVertically(shapes)

      // Total height: 50 + 50 + 50 = 150
      // Total space: 350 - 0 - 150 = 200
      // Spacing: 200 / 2 = 100
      // Middle shape should be at: 0 + 50 + 100 = 150
      expect(result['2'].y).toBe(150)
      // First and last shapes should not move
      expect(result['1']).toBeUndefined()
      expect(result['3']).toBeUndefined()
    })

    it('should return empty object for less than 3 shapes', () => {
      const shapes: Shape[] = [
        createTestShape('1', 0, 0),
        createTestShape('2', 0, 100),
      ]
      const result = distributeVertically(shapes)
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('centerInCanvas', () => {
    it('should center shapes in canvas viewport', () => {
      const shapes: Shape[] = [
        createTestShape('1', 0, 0, 100, 100),
        createTestShape('2', 100, 100, 100, 100),
      ]
      const canvasWidth = 800
      const canvasHeight = 600

      const result = centerInCanvas(shapes, canvasWidth, canvasHeight)

      // Bounding box: x: 0-200, y: 0-200
      // Bounding center: (100, 100)
      // Canvas center: (400, 300)
      // Offset: (300, 200)
      expect(result['1'].x).toBe(300)
      expect(result['1'].y).toBe(200)
      expect(result['2'].x).toBe(400)
      expect(result['2'].y).toBe(300)
    })

    it('should return empty object for no shapes', () => {
      const result = centerInCanvas([], 800, 600)
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle shapes with different sizes correctly', () => {
      const shapes: Shape[] = [
        createTestShape('1', 0, 0, 50, 50),
        createTestShape('2', 100, 50, 150, 100),
        createTestShape('3', 300, 100, 200, 150),
      ]

      const leftResult = alignLeft(shapes)
      expect(leftResult['1'].x).toBe(0)
      expect(leftResult['2'].x).toBe(0)
      expect(leftResult['3'].x).toBe(0)

      const rightResult = alignRight(shapes)
      // Rightmost edge is at 500 (300 + 200)
      expect(rightResult['1'].x).toBe(450) // 500 - 50
      expect(rightResult['2'].x).toBe(350) // 500 - 150
      expect(rightResult['3'].x).toBe(300) // 500 - 200
    })

    it('should handle negative coordinates', () => {
      const shapes: Shape[] = [
        createTestShape('1', -50, -50),
        createTestShape('2', 0, 0),
        createTestShape('3', 50, 50),
      ]

      const result = alignLeft(shapes)
      expect(result['1'].x).toBe(-50)
      expect(result['2'].x).toBe(-50)
      expect(result['3'].x).toBe(-50)
    })
  })
})


