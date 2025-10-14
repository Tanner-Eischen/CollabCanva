// Multi-select and selection-related TypeScript types

/**
 * Selection box for drag-to-select (marquee selection)
 * Represents the visual rectangle drawn during drag
 */
export interface SelectionBox {
  startX: number // starting X coordinate when drag begins
  startY: number // starting Y coordinate when drag begins
  currentX: number // current X coordinate during drag
  currentY: number // current Y coordinate during drag
  visible: boolean // whether the selection box is currently visible
}

/**
 * Selection state for the canvas
 * Tracks which shapes are currently selected
 */
export interface SelectionState {
  selectedIds: Set<string> // Set of selected shape IDs (O(1) lookup)
  lastSelectedId: string | null // most recently selected shape ID
}

/**
 * Helper function to create an empty selection state
 */
export const createEmptySelection = (): SelectionState => ({
  selectedIds: new Set<string>(),
  lastSelectedId: null,
})

/**
 * Helper function to create an initial selection box (hidden)
 */
export const createInitialSelectionBox = (): SelectionBox => ({
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  visible: false,
})

/**
 * Calculate the actual bounds of a selection box
 * Handles the case where drag goes in any direction (up/down/left/right)
 */
export const getSelectionBoxBounds = (box: SelectionBox) => {
  const x = Math.min(box.startX, box.currentX)
  const y = Math.min(box.startY, box.currentY)
  const width = Math.abs(box.currentX - box.startX)
  const height = Math.abs(box.currentY - box.startY)
  
  return { x, y, width, height }
}

/**
 * Check if a shape intersects with the selection box
 */
export const shapeIntersectsSelectionBox = (
  shape: { x: number; y: number; width: number; height: number },
  box: SelectionBox
): boolean => {
  const boxBounds = getSelectionBoxBounds(box)
  
  // Check if rectangles intersect
  return !(
    shape.x + shape.width < boxBounds.x || // shape is left of box
    shape.x > boxBounds.x + boxBounds.width || // shape is right of box
    shape.y + shape.height < boxBounds.y || // shape is above box
    shape.y > boxBounds.y + boxBounds.height // shape is below box
  )
}

