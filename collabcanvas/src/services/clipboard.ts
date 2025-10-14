// Clipboard Service for Copy/Paste/Duplicate Operations
// In-memory clipboard only (no native clipboard integration)

import type { Shape } from '../types/canvas'
import { v4 as uuidv4 } from 'uuid'

/**
 * In-memory clipboard storage
 */
let clipboardData: Shape[] = []

/**
 * Offset for pasted/duplicated shapes (pixels)
 */
const PASTE_OFFSET = 20

/**
 * Copy shapes to in-memory clipboard
 * @param shapes - Array of shapes to copy
 */
export const copyShapes = (shapes: Shape[]): void => {
  // Deep clone the shapes to avoid reference issues
  clipboardData = shapes.map((shape) => ({ ...shape }))
}

/**
 * Get copied shapes from clipboard with new IDs and offset positions
 * @returns Array of new shapes with updated IDs and positions
 */
export const pasteShapes = (): Shape[] => {
  if (clipboardData.length === 0) {
    return []
  }

  // Create new shapes with new IDs and offset positions
  return clipboardData.map((shape) => ({
    ...shape,
    id: uuidv4(), // Generate new UUID
    x: shape.x + PASTE_OFFSET, // Offset position
    y: shape.y + PASTE_OFFSET,
  }))
}

/**
 * Duplicate shapes with small offset
 * @param shapes - Array of shapes to duplicate
 * @returns Array of new shapes with updated IDs and positions
 */
export const duplicateShapes = (shapes: Shape[]): Shape[] => {
  if (shapes.length === 0) {
    return []
  }

  // Create duplicates with new IDs and offset positions
  return shapes.map((shape) => ({
    ...shape,
    id: uuidv4(), // Generate new UUID
    x: shape.x + PASTE_OFFSET, // Offset position
    y: shape.y + PASTE_OFFSET,
  }))
}

/**
 * Check if clipboard has data
 * @returns True if clipboard contains shapes
 */
export const hasClipboardData = (): boolean => {
  return clipboardData.length > 0
}

/**
 * Clear clipboard data
 */
export const clearClipboard = (): void => {
  clipboardData = []
}

