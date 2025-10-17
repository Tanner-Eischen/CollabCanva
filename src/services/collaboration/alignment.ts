// Alignment Service - Calculations for aligning and distributing shapes (PR-18)

import type { Shape } from '../../types/canvas'

/**
 * Alignment type for positioning shapes
 */
export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

/**
 * Distribution type for spacing shapes
 */
export type DistributionType = 'horizontal' | 'vertical'

/**
 * Result of alignment operation
 * Returns map of shape IDs to new positions
 */
export interface AlignmentResult {
  [shapeId: string]: { x: number; y: number }
}

/**
 * Align shapes to the left (leftmost edge)
 */
export function alignLeft(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 2) return {}

  // Find the leftmost x coordinate
  const minX = Math.min(...shapes.map(s => s.x))

  // Create updates for all shapes
  const updates: AlignmentResult = {}
  shapes.forEach(shape => {
    updates[shape.id] = { x: minX, y: shape.y }
  })

  return updates
}

/**
 * Align shapes to horizontal center
 */
export function alignCenter(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 2) return {}

  // Calculate the average center x
  const centerXs = shapes.map(s => s.x + s.width / 2)
  const avgCenterX = centerXs.reduce((sum, x) => sum + x, 0) / centerXs.length

  // Create updates for all shapes
  const updates: AlignmentResult = {}
  shapes.forEach(shape => {
    updates[shape.id] = { x: avgCenterX - shape.width / 2, y: shape.y }
  })

  return updates
}

/**
 * Align shapes to the right (rightmost edge)
 */
export function alignRight(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 2) return {}

  // Find the rightmost x coordinate
  const maxX = Math.max(...shapes.map(s => s.x + s.width))

  // Create updates for all shapes
  const updates: AlignmentResult = {}
  shapes.forEach(shape => {
    updates[shape.id] = { x: maxX - shape.width, y: shape.y }
  })

  return updates
}

/**
 * Align shapes to the top (topmost edge)
 */
export function alignTop(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 2) return {}

  // Find the topmost y coordinate
  const minY = Math.min(...shapes.map(s => s.y))

  // Create updates for all shapes
  const updates: AlignmentResult = {}
  shapes.forEach(shape => {
    updates[shape.id] = { x: shape.x, y: minY }
  })

  return updates
}

/**
 * Align shapes to vertical middle
 */
export function alignMiddle(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 2) return {}

  // Calculate the average center y
  const centerYs = shapes.map(s => s.y + s.height / 2)
  const avgCenterY = centerYs.reduce((sum, y) => sum + y, 0) / centerYs.length

  // Create updates for all shapes
  const updates: AlignmentResult = {}
  shapes.forEach(shape => {
    updates[shape.id] = { x: shape.x, y: avgCenterY - shape.height / 2 }
  })

  return updates
}

/**
 * Align shapes to the bottom (bottommost edge)
 */
export function alignBottom(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 2) return {}

  // Find the bottommost y coordinate
  const maxY = Math.max(...shapes.map(s => s.y + s.height))

  // Create updates for all shapes
  const updates: AlignmentResult = {}
  shapes.forEach(shape => {
    updates[shape.id] = { x: shape.x, y: maxY - shape.height }
  })

  return updates
}

/**
 * Distribute shapes horizontally with equal spacing
 * Requires at least 3 shapes
 */
export function distributeHorizontally(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 3) return {}

  // Sort shapes by x position
  const sortedShapes = [...shapes].sort((a, b) => a.x - b.x)

  // Find leftmost and rightmost edges
  const leftmost = sortedShapes[0]
  const rightmost = sortedShapes[sortedShapes.length - 1]
  const leftEdge = leftmost.x
  const rightEdge = rightmost.x + rightmost.width

  // Calculate total space between shapes
  const totalWidth = sortedShapes.reduce((sum, s) => sum + s.width, 0)
  const availableSpace = rightEdge - leftEdge - totalWidth
  const spacing = availableSpace / (sortedShapes.length - 1)

  // Create updates for all shapes (except first and last which stay in place)
  const updates: AlignmentResult = {}
  let currentX = leftEdge

  sortedShapes.forEach((shape, index) => {
    if (index === 0) {
      // First shape stays in place
      currentX += shape.width + spacing
    } else if (index === sortedShapes.length - 1) {
      // Last shape stays in place
    } else {
      // Middle shapes get evenly distributed
      updates[shape.id] = { x: currentX, y: shape.y }
      currentX += shape.width + spacing
    }
  })

  return updates
}

/**
 * Distribute shapes vertically with equal spacing
 * Requires at least 3 shapes
 */
export function distributeVertically(shapes: Shape[]): AlignmentResult {
  if (shapes.length < 3) return {}

  // Sort shapes by y position
  const sortedShapes = [...shapes].sort((a, b) => a.y - b.y)

  // Find topmost and bottommost edges
  const topmost = sortedShapes[0]
  const bottommost = sortedShapes[sortedShapes.length - 1]
  const topEdge = topmost.y
  const bottomEdge = bottommost.y + bottommost.height

  // Calculate total space between shapes
  const totalHeight = sortedShapes.reduce((sum, s) => sum + s.height, 0)
  const availableSpace = bottomEdge - topEdge - totalHeight
  const spacing = availableSpace / (sortedShapes.length - 1)

  // Create updates for all shapes (except first and last which stay in place)
  const updates: AlignmentResult = {}
  let currentY = topEdge

  sortedShapes.forEach((shape, index) => {
    if (index === 0) {
      // First shape stays in place
      currentY += shape.height + spacing
    } else if (index === sortedShapes.length - 1) {
      // Last shape stays in place
    } else {
      // Middle shapes get evenly distributed
      updates[shape.id] = { x: shape.x, y: currentY }
      currentY += shape.height + spacing
    }
  })

  return updates
}

/**
 * Center shapes in the canvas viewport
 */
export function centerInCanvas(
  shapes: Shape[],
  canvasWidth: number,
  canvasHeight: number
): AlignmentResult {
  if (shapes.length === 0) return {}

  // Calculate bounding box of all shapes
  const minX = Math.min(...shapes.map(s => s.x))
  const maxX = Math.max(...shapes.map(s => s.x + s.width))
  const minY = Math.min(...shapes.map(s => s.y))
  const maxY = Math.max(...shapes.map(s => s.y + s.height))

  const boundingWidth = maxX - minX
  const boundingHeight = maxY - minY

  // Calculate center offset
  const targetCenterX = canvasWidth / 2
  const targetCenterY = canvasHeight / 2
  const currentCenterX = minX + boundingWidth / 2
  const currentCenterY = minY + boundingHeight / 2

  const offsetX = targetCenterX - currentCenterX
  const offsetY = targetCenterY - currentCenterY

  // Create updates for all shapes
  const updates: AlignmentResult = {}
  shapes.forEach(shape => {
    updates[shape.id] = {
      x: shape.x + offsetX,
      y: shape.y + offsetY,
    }
  })

  return updates
}

/**
 * Generic alignment function that calls the appropriate specific function
 */
export function alignShapes(shapes: Shape[], type: AlignmentType): AlignmentResult {
  switch (type) {
    case 'left':
      return alignLeft(shapes)
    case 'center':
      return alignCenter(shapes)
    case 'right':
      return alignRight(shapes)
    case 'top':
      return alignTop(shapes)
    case 'middle':
      return alignMiddle(shapes)
    case 'bottom':
      return alignBottom(shapes)
    default:
      return {}
  }
}


