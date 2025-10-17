/**
 * Path Helper Utilities (PR-21)
 * Functions for path simplification and smoothing for freehand drawing
 */

/**
 * Calculate perpendicular distance from a point to a line segment
 */
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  // Normalize
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag > 0) {
    const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag)
    const closest = {
      x: lineStart.x + u * dx,
      y: lineStart.y + u * dy,
    }
    return Math.sqrt(
      (point.x - closest.x) ** 2 + (point.y - closest.y) ** 2
    )
  } else {
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    )
  }
}

/**
 * Douglas-Peucker algorithm for path simplification
 * Reduces the number of points while maintaining the shape
 * @param points Flat array of coordinates [x1, y1, x2, y2, ...]
 * @param tolerance Maximum distance a point can be from the simplified line
 * @returns Simplified flat array of coordinates
 */
export function simplifyPath(points: number[], tolerance: number = 2): number[] {
  if (points.length <= 4) {
    // Less than 2 points, can't simplify
    return points
  }

  // Convert flat array to point objects
  const pointObjects: { x: number; y: number }[] = []
  for (let i = 0; i < points.length; i += 2) {
    pointObjects.push({ x: points[i], y: points[i + 1] })
  }

  // Recursive Douglas-Peucker
  function douglasPeucker(
    pts: { x: number; y: number }[],
    startIndex: number,
    endIndex: number
  ): { x: number; y: number }[] {
    if (endIndex <= startIndex + 1) {
      return []
    }

    // Find the point with the maximum distance from the line segment
    let maxDistance = 0
    let maxIndex = startIndex

    for (let i = startIndex + 1; i < endIndex; i++) {
      const distance = perpendicularDistance(
        pts[i],
        pts[startIndex],
        pts[endIndex]
      )
      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const left = douglasPeucker(pts, startIndex, maxIndex)
      const right = douglasPeucker(pts, maxIndex, endIndex)
      return [...left, pts[maxIndex], ...right]
    } else {
      return []
    }
  }

  const simplified = [
    pointObjects[0],
    ...douglasPeucker(pointObjects, 0, pointObjects.length - 1),
    pointObjects[pointObjects.length - 1],
  ]

  // Convert back to flat array
  const result: number[] = []
  for (const point of simplified) {
    result.push(point.x, point.y)
  }

  return result
}

/**
 * Smooth a path using Catmull-Rom spline interpolation
 * Note: This is a simplified version that doesn't actually interpolate,
 * but returns the original points for use with Konva's tension parameter
 * @param points Flat array of coordinates [x1, y1, x2, y2, ...]
 * @returns Smoothed flat array of coordinates
 */
export function smoothPath(points: number[]): number[] {
  // For Konva, smoothing is handled by the tension parameter
  // This function mainly ensures the path has enough points
  // and removes duplicate consecutive points
  
  if (points.length <= 4) {
    return points
  }

  const smoothed: number[] = []
  let lastX: number | null = null
  let lastY: number | null = null

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]

    // Skip duplicate consecutive points
    if (x !== lastX || y !== lastY) {
      smoothed.push(x, y)
      lastX = x
      lastY = y
    }
  }

  return smoothed
}

/**
 * Calculate bounding box for a path (for selection)
 * @param points Flat array of coordinates [x1, y1, x2, y2, ...]
 * @returns Bounding box with min/max x/y coordinates
 */
export function calculatePathBounds(points: number[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (points.length < 2) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Calculate distance between two consecutive points
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Sample points along a path to ensure minimum spacing
 * Used for pen tool to create smoother, fewer points
 * @param points Flat array of coordinates [x1, y1, x2, y2, ...]
 * @param minSpacing Minimum distance between points
 * @returns Filtered flat array of coordinates
 */
export function samplePathPoints(points: number[], minSpacing: number = 5): number[] {
  if (points.length <= 2) {
    return points
  }

  const sampled: number[] = [points[0], points[1]] // Always include first point

  let lastX = points[0]
  let lastY = points[1]

  for (let i = 2; i < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]

    const distance = getDistance(lastX, lastY, x, y)
    
    if (distance >= minSpacing) {
      sampled.push(x, y)
      lastX = x
      lastY = y
    }
  }

  // Always include last point if it's not already there
  const lastPointX = points[points.length - 2]
  const lastPointY = points[points.length - 1]
  if (lastX !== lastPointX || lastY !== lastPointY) {
    sampled.push(lastPointX, lastPointY)
  }

  return sampled
}

