/**
 * Unit Tests for Path Helper Utilities (PR-21)
 */

import { describe, it, expect } from 'vitest'
import {
  simplifyPath,
  smoothPath,
  calculatePathBounds,
  getDistance,
  samplePathPoints,
} from '../../../src/utils/pathHelpers'

describe('Path Helper Utilities', () => {
  describe('simplifyPath', () => {
    it('should reduce point count while maintaining shape', () => {
      // Create a path with many points along a line
      const points = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 10, 10]
      const simplified = simplifyPath(points, 1)

      // Should have fewer points but still include start and end
      expect(simplified.length).toBeLessThan(points.length)
      expect(simplified[0]).toBe(0) // First X
      expect(simplified[1]).toBe(0) // First Y
      expect(simplified[simplified.length - 2]).toBe(10) // Last X
      expect(simplified[simplified.length - 1]).toBe(10) // Last Y
    })

    it('should keep all points with tolerance 0', () => {
      const points = [0, 0, 1, 1, 2, 2, 3, 3]
      const simplified = simplifyPath(points, 0)

      // With tolerance 0, should keep all points
      expect(simplified.length).toBe(points.length)
    })

    it('should handle paths with less than 2 points', () => {
      const points = [0, 0]
      const simplified = simplifyPath(points, 2)

      expect(simplified).toEqual(points)
    })

    it('should simplify more aggressively with higher tolerance', () => {
      const points = [0, 0, 1, 0.1, 2, 0.2, 3, 0.1, 4, 0, 5, 0]
      
      const simplified1 = simplifyPath(points, 0.5)
      const simplified2 = simplifyPath(points, 2)

      // Higher tolerance should result in fewer points
      expect(simplified2.length).toBeLessThanOrEqual(simplified1.length)
    })

    it('should maintain start and end points', () => {
      const points = [10, 20, 15, 25, 20, 30, 25, 35, 30, 40]
      const simplified = simplifyPath(points, 5)

      expect(simplified[0]).toBe(10)
      expect(simplified[1]).toBe(20)
      expect(simplified[simplified.length - 2]).toBe(30)
      expect(simplified[simplified.length - 1]).toBe(40)
    })
  })

  describe('smoothPath', () => {
    it('should return original points for smooth paths', () => {
      const points = [0, 0, 10, 10, 20, 20, 30, 30]
      const smoothed = smoothPath(points)

      expect(smoothed).toEqual(points)
    })

    it('should remove duplicate consecutive points', () => {
      const points = [0, 0, 0, 0, 10, 10, 10, 10, 20, 20]
      const smoothed = smoothPath(points)

      expect(smoothed).toEqual([0, 0, 10, 10, 20, 20])
    })

    it('should handle empty or single point paths', () => {
      expect(smoothPath([])).toEqual([])
      expect(smoothPath([5, 10])).toEqual([5, 10])
    })

    it('should preserve non-duplicate points', () => {
      const points = [0, 0, 5, 5, 10, 10, 15, 15]
      const smoothed = smoothPath(points)

      expect(smoothed.length).toBe(points.length)
    })
  })

  describe('calculatePathBounds', () => {
    it('should return correct bounding box', () => {
      const points = [10, 20, 50, 80, 30, 100, 70, 40]
      const bounds = calculatePathBounds(points)

      expect(bounds.minX).toBe(10)
      expect(bounds.minY).toBe(20)
      expect(bounds.maxX).toBe(70)
      expect(bounds.maxY).toBe(100)
      expect(bounds.width).toBe(60)
      expect(bounds.height).toBe(80)
    })

    it('should handle single point', () => {
      const points = [50, 75]
      const bounds = calculatePathBounds(points)

      expect(bounds.minX).toBe(50)
      expect(bounds.minY).toBe(75)
      expect(bounds.maxX).toBe(50)
      expect(bounds.maxY).toBe(75)
      expect(bounds.width).toBe(0)
      expect(bounds.height).toBe(0)
    })

    it('should handle empty path', () => {
      const points: number[] = []
      const bounds = calculatePathBounds(points)

      expect(bounds.minX).toBe(0)
      expect(bounds.minY).toBe(0)
      expect(bounds.maxX).toBe(0)
      expect(bounds.maxY).toBe(0)
      expect(bounds.width).toBe(0)
      expect(bounds.height).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const points = [-10, -20, 30, 40, 10, -5]
      const bounds = calculatePathBounds(points)

      expect(bounds.minX).toBe(-10)
      expect(bounds.minY).toBe(-20)
      expect(bounds.maxX).toBe(30)
      expect(bounds.maxY).toBe(40)
      expect(bounds.width).toBe(40)
      expect(bounds.height).toBe(60)
    })
  })

  describe('getDistance', () => {
    it('should calculate correct distance', () => {
      const distance = getDistance(0, 0, 3, 4)
      expect(distance).toBe(5) // 3-4-5 triangle
    })

    it('should return 0 for same point', () => {
      const distance = getDistance(10, 20, 10, 20)
      expect(distance).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const distance = getDistance(-3, -4, 0, 0)
      expect(distance).toBe(5)
    })
  })

  describe('samplePathPoints', () => {
    it('should sample points with minimum spacing', () => {
      // Create points with varying distances
      const points = [0, 0, 1, 0, 2, 0, 10, 0, 11, 0, 20, 0]
      const sampled = samplePathPoints(points, 5)

      // Should keep points at least 5 units apart
      for (let i = 2; i < sampled.length - 2; i += 2) {
        const dist = getDistance(sampled[i - 2], sampled[i - 1], sampled[i], sampled[i + 1])
        expect(dist).toBeGreaterThanOrEqual(5)
      }
    })

    it('should always include first and last points', () => {
      const points = [0, 0, 1, 1, 2, 2, 3, 3, 10, 10]
      const sampled = samplePathPoints(points, 5)

      expect(sampled[0]).toBe(0)
      expect(sampled[1]).toBe(0)
      expect(sampled[sampled.length - 2]).toBe(10)
      expect(sampled[sampled.length - 1]).toBe(10)
    })

    it('should handle single point', () => {
      const points = [5, 10]
      const sampled = samplePathPoints(points, 5)

      expect(sampled).toEqual(points)
    })

    it('should keep more points with smaller spacing', () => {
      const points = [0, 0, 2, 0, 4, 0, 6, 0, 8, 0, 10, 0]
      
      const sampled3 = samplePathPoints(points, 3)
      const sampled6 = samplePathPoints(points, 6)

      // Smaller spacing should keep more points
      expect(sampled3.length).toBeGreaterThan(sampled6.length)
    })
  })
})

