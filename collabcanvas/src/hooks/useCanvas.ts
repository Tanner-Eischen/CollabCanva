import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Shape } from '../types/canvas'
import { DEFAULT_CANVAS_CONFIG } from '../types/canvas'
import {
  syncCreateShape,
  syncUpdateShape,
  syncDeleteShape,
  syncBulkMove,
  syncBulkDelete,
  syncBatchCreate,
  syncZIndex,
  subscribeToCanvas,
} from '../services/canvasSync'
import {
  copyShapes as copyShapesToClipboard,
  pasteShapes as pasteShapesFromClipboard,
  duplicateShapes as duplicateShapesInternal,
} from '../services/clipboard'
import { createHistoryManager } from '../services/commandHistory'
import { CreateCommand } from '../commands/CreateCommand'
import { DeleteCommand } from '../commands/DeleteCommand'
import { ZIndexCommand } from '../commands/ZIndexCommand'
import {
  loadRecentColors,
  saveRecentColors,
} from '../services/colorStorage'

interface UseCanvasOptions {
  canvasId: string
  userId: string
  enableSync?: boolean
}

interface UseCanvasReturn {
  shapes: Shape[]
  selectedId: string | null // for backward compatibility
  selectedIds: Set<string> // NEW: multi-select support
  addShape: (type: 'rectangle' | 'circle', x: number, y: number) => string
  addText: (text: string, x: number, y: number) => string | null
  updateShape: (id: string, updates: Partial<Shape>) => void
  deleteShape: (id: string) => void
  setSelection: (id: string | null) => void // for backward compatibility
  // NEW: Multi-select functions
  toggleSelection: (id: string) => void
  selectMultiple: (ids: string[]) => void
  clearSelection: () => void
  selectAll: () => void
  getSelectedShapes: () => Shape[]
  bulkMove: (deltaX: number, deltaY: number) => void
  bulkDelete: () => void
  // NEW: Copy/Paste/Duplicate functions (PR-13)
  copySelected: () => void
  paste: () => void
  duplicateSelected: () => void
  // NEW: Undo/Redo functions (PR-14)
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  // NEW: Color management functions (PR-15)
  updateColors: (fill?: string, stroke?: string, strokeWidth?: number) => void
  getRecentColors: () => string[]
  addRecentColor: (color: string) => void
  // NEW: Advanced shape creation functions (PR-16)
  addLine: (x1: number, y1: number, x2: number, y2: number, arrows?: { start?: boolean; end?: boolean }) => string
  addPolygon: (x: number, y: number, sides?: number) => string
  addStar: (x: number, y: number, points?: number) => string
  addRoundedRect: (x: number, y: number, cornerRadius?: number) => string
  // NEW: Z-index manipulation functions (PR-17)
  bringToFront: (ids?: string[]) => void
  sendToBack: (ids?: string[]) => void
  bringForward: (ids?: string[]) => void
  sendBackward: (ids?: string[]) => void
  sortShapesByZIndex: () => Shape[]
}

/**
 * Hook for managing canvas shapes state with Firebase sync
 * Handles shape creation, updates, deletion, and selection
 */
export function useCanvas(options?: UseCanvasOptions): UseCanvasReturn {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null) // for backward compatibility
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()) // NEW: multi-select
  const syncEnabled = options?.enableSync ?? true
  const canvasId = options?.canvasId ?? 'default-canvas'
  const userId = options?.userId ?? ''
  
  // Track locally created shapes to avoid duplicate onCreate from Firebase
  const localShapesRef = useRef(new Set<string>())
  
  // Command history for undo/redo (PR-14)
  const historyManager = useMemo(() => createHistoryManager(), [])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  // Recent colors for color picker (PR-15)
  const [recentColors, setRecentColors] = useState<string[]>(() => loadRecentColors())
  const DEFAULT_FILL = '#3B82F6FF' // Default blue with full opacity

  /**
   * Helper function to add shape to state (used by commands)
   */
  const addShapeToState = useCallback((shape: Shape): void => {
    setShapes((prev) => [...prev, shape])
    localShapesRef.current.add(shape.id)
  }, [])

  /**
   * Helper function to remove shape from state (used by commands)
   */
  const removeShapeFromState = useCallback((id: string): void => {
    setShapes((prev) => prev.filter((shape) => shape.id !== id))
    localShapesRef.current.delete(id)
  }, [])

  /**
   * Helper function to sync shape creation (used by commands)
   */
  const syncShapeCreate = useCallback(
    (shape: Shape): Promise<void> => {
      if (syncEnabled && userId) {
        return syncCreateShape(canvasId, shape.id, shape)
      }
      return Promise.resolve()
    },
    [syncEnabled, userId, canvasId]
  )

  /**
   * Helper function to sync shape deletion (used by commands)
   */
  const syncShapeDelete = useCallback(
    (id: string): Promise<void> => {
      if (syncEnabled && userId) {
        return syncDeleteShape(canvasId, id)
      }
      return Promise.resolve()
    },
    [syncEnabled, userId, canvasId]
  )

  /**
   * Update undo/redo availability after each command execution
   */
  const updateHistoryState = useCallback((): void => {
    setCanUndo(historyManager.canUndo())
    setCanRedo(historyManager.canRedo())
  }, [historyManager])

  /**
   * Add a rectangle or circle shape
   * All shapes are fixed 100x100px, blue (#3B82F6)
   * Uses command pattern for undo/redo (PR-14)
   */
  const addShape = useCallback(
    (type: 'rectangle' | 'circle', x: number, y: number): string => {
      const id = uuidv4()
      const newShape: Shape = {
        id,
        type,
        x,
        y,
        width: DEFAULT_CANVAS_CONFIG.defaultShapeSize,
        height: DEFAULT_CANVAS_CONFIG.defaultShapeSize,
        fill: DEFAULT_FILL, // PR-15: Default color
        zIndex: Date.now(), // PR-17: Set z-index to current timestamp
      }

      // Create command for this operation
      const command = new CreateCommand(
        newShape,
        addShapeToState,
        removeShapeFromState,
        syncShapeCreate,
        syncShapeDelete
      )
      
      // Execute command and add to history
      historyManager.executeCommand(command)
      updateHistoryState()
      
      return id
    },
    [historyManager, addShapeToState, removeShapeFromState, syncShapeCreate, syncShapeDelete, updateHistoryState]
  )

  /**
   * Add a text shape
   * Validates that text is not empty (min 1 character)
   * Auto-calculates dimensions based on content
   * Uses command pattern for undo/redo (PR-14)
   */
  const addText = useCallback(
    (text: string, x: number, y: number): string | null => {
      // Validate text - prevent empty text objects
      if (!text || text.trim().length === 0) {
        return null
      }

      const id = uuidv4()

      // Calculate text dimensions (approximate)
      const fontSize = 20
      const charWidth = fontSize * 0.6 // Approximate character width
      const width = Math.max(text.length * charWidth, 50)
      const height = fontSize + 10 // Add some padding

      const newShape: Shape = {
        id,
        type: 'text',
        x,
        y,
        width,
        height,
        text,
        fill: DEFAULT_FILL, // PR-15: Default color
        zIndex: Date.now(), // PR-17: Set z-index to current timestamp
      }

      // Create command for this operation
      const command = new CreateCommand(
        newShape,
        addShapeToState,
        removeShapeFromState,
        syncShapeCreate,
        syncShapeDelete
      )
      
      // Execute command and add to history
      historyManager.executeCommand(command)
      updateHistoryState()
      
      return id
    },
    [historyManager, addShapeToState, removeShapeFromState, syncShapeCreate, syncShapeDelete, updateHistoryState]
  )

  /**
   * Add a line shape (PR-16)
   * Creates a line with two endpoints and optional arrows
   */
  const addLine = useCallback(
    (x1: number, y1: number, x2: number, y2: number, arrows?: { start?: boolean; end?: boolean }): string => {
      const id = uuidv4()
      const newShape: Shape = {
        id,
        type: 'line',
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        points: [x1, y1, x2, y2],
        fill: DEFAULT_FILL,
        arrows: arrows || { start: false, end: false },
        zIndex: Date.now(), // PR-17: Set z-index to current timestamp
      }

      const command = new CreateCommand(
        newShape,
        addShapeToState,
        removeShapeFromState,
        syncShapeCreate,
        syncShapeDelete
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
      
      return id
    },
    [historyManager, addShapeToState, removeShapeFromState, syncShapeCreate, syncShapeDelete, updateHistoryState, DEFAULT_FILL]
  )

  /**
   * Add a polygon shape (PR-16)
   * Creates a regular polygon with specified number of sides (default: 5)
   */
  const addPolygon = useCallback(
    (x: number, y: number, sides: number = 5): string => {
      const id = uuidv4()
      const size = DEFAULT_CANVAS_CONFIG.defaultShapeSize
      
      const newShape: Shape = {
        id,
        type: 'polygon',
        x,
        y,
        width: size,
        height: size,
        fill: DEFAULT_FILL,
        sides: Math.max(3, Math.min(12, sides)),
        zIndex: Date.now(), // PR-17: Set z-index to current timestamp
      }

      const command = new CreateCommand(
        newShape,
        addShapeToState,
        removeShapeFromState,
        syncShapeCreate,
        syncShapeDelete
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
      
      return id
    },
    [historyManager, addShapeToState, removeShapeFromState, syncShapeCreate, syncShapeDelete, updateHistoryState, DEFAULT_FILL]
  )

  /**
   * Add a star shape (PR-16)
   * Creates a star with specified number of points (default: 5)
   */
  const addStar = useCallback(
    (x: number, y: number, points: number = 5): string => {
      const id = uuidv4()
      const size = DEFAULT_CANVAS_CONFIG.defaultShapeSize
      
      const newShape: Shape = {
        id,
        type: 'star',
        x,
        y,
        width: size,
        height: size,
        fill: DEFAULT_FILL,
        sides: Math.max(3, Math.min(12, points)),
        zIndex: Date.now(), // PR-17: Set z-index to current timestamp
      }

      const command = new CreateCommand(
        newShape,
        addShapeToState,
        removeShapeFromState,
        syncShapeCreate,
        syncShapeDelete
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
      
      return id
    },
    [historyManager, addShapeToState, removeShapeFromState, syncShapeCreate, syncShapeDelete, updateHistoryState, DEFAULT_FILL]
  )

  /**
   * Add a rounded rectangle shape (PR-16)
   * Creates a rectangle with rounded corners (default: 10px radius)
   */
  const addRoundedRect = useCallback(
    (x: number, y: number, cornerRadius: number = 10): string => {
      const id = uuidv4()
      const size = DEFAULT_CANVAS_CONFIG.defaultShapeSize
      
      const newShape: Shape = {
        id,
        type: 'roundRect',
        x,
        y,
        width: size,
        height: size,
        fill: DEFAULT_FILL,
        cornerRadius: Math.max(0, Math.min(50, cornerRadius)),
        zIndex: Date.now(), // PR-17: Set z-index to current timestamp
      }

      const command = new CreateCommand(
        newShape,
        addShapeToState,
        removeShapeFromState,
        syncShapeCreate,
        syncShapeDelete
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
      
      return id
    },
    [historyManager, addShapeToState, removeShapeFromState, syncShapeCreate, syncShapeDelete, updateHistoryState, DEFAULT_FILL]
  )

  /**
   * Update shape properties (position, dimensions, rotation, colors)
   */
  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>): void => {
      // Update local state immediately
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape
        )
      )
      
      // Sync to Firebase if any syncable properties changed
      const hasSyncableUpdate = 
        updates.x !== undefined ||
        updates.y !== undefined ||
        updates.width !== undefined ||
        updates.height !== undefined ||
        updates.rotation !== undefined ||
        updates.fill !== undefined ||
        updates.stroke !== undefined ||
        updates.strokeWidth !== undefined ||
        updates.zIndex !== undefined
      
      if (syncEnabled && userId && hasSyncableUpdate) {
        syncUpdateShape(canvasId, id, updates).catch((error) => {
          console.error('Failed to sync shape update:', error)
        })
      }
    },
    [syncEnabled, canvasId, userId]
  )

  /**
   * Delete a shape and clear selection if it was selected
   * Uses command pattern for undo/redo (PR-14)
   */
  const deleteShape = useCallback(
    (id: string): void => {
      // Find the shape to delete (need it for undo)
      const shapeToDelete = shapes.find((shape) => shape.id === id)
      if (!shapeToDelete) return

      // Clear selection if this shape was selected
      setSelectedId((prev) => (prev === id ? null : prev))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })

      // Create command for this operation
      const command = new DeleteCommand(
        shapeToDelete,
        addShapeToState,
        removeShapeFromState,
        syncShapeCreate,
        syncShapeDelete
      )
      
      // Execute command and add to history
      historyManager.executeCommand(command)
      updateHistoryState()
    },
    [shapes, historyManager, addShapeToState, removeShapeFromState, syncShapeCreate, syncShapeDelete, updateHistoryState]
  )

  /**
   * Set selected shape ID (backward compatibility - single selection)
   * Selection state is synced via presence (handled in Canvas component)
   */
  const setSelection = useCallback((id: string | null): void => {
    setSelectedId(id)
    // Update selectedIds to match
    if (id === null) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set([id]))
    }
  }, [])

  /**
   * Toggle selection of a shape (add/remove from selection)
   * Used for Shift+Click behavior
   */
  const toggleSelection = useCallback((id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // Update selectedId for backward compatibility (use last selected)
      setSelectedId(next.size > 0 ? id : null)
      return next
    })
  }, [])

  /**
   * Select multiple shapes at once
   * Used after drag-to-select box completes
   */
  const selectMultiple = useCallback((ids: string[]): void => {
    const newSelection = new Set(ids)
    setSelectedIds(newSelection)
    // Update selectedId for backward compatibility (use last in array)
    setSelectedId(ids.length > 0 ? ids[ids.length - 1] : null)
  }, [])

  /**
   * Clear all selections
   */
  const clearSelection = useCallback((): void => {
    setSelectedIds(new Set())
    setSelectedId(null)
  }, [])

  /**
   * Select all shapes on the canvas
   */
  const selectAll = useCallback((): void => {
    const allIds = shapes.map((shape) => shape.id)
    selectMultiple(allIds)
  }, [shapes, selectMultiple])

  /**
   * Get array of currently selected shape objects
   */
  const getSelectedShapes = useCallback((): Shape[] => {
    return shapes.filter((shape) => selectedIds.has(shape.id))
  }, [shapes, selectedIds])

  /**
   * Move all selected shapes by delta amount
   * Maintains relative positions
   */
  const bulkMove = useCallback(
    (deltaX: number, deltaY: number): void => {
      const updates: Record<string, { x: number; y: number }> = {}
      
      // Calculate new positions for all selected shapes
      shapes.forEach((shape) => {
        if (selectedIds.has(shape.id)) {
          updates[shape.id] = {
            x: shape.x + deltaX,
            y: shape.y + deltaY,
          }
        }
      })
      
      // Update local state immediately
      setShapes((prev) =>
        prev.map((shape) =>
          updates[shape.id]
            ? { ...shape, ...updates[shape.id] }
            : shape
        )
      )
      
      // Sync to Firebase (only if user is authenticated)
      if (syncEnabled && userId && Object.keys(updates).length > 0) {
        syncBulkMove(canvasId, updates).catch((error) => {
          console.error('Failed to sync bulk move:', error)
        })
      }
    },
    [shapes, selectedIds, syncEnabled, canvasId, userId]
  )

  /**
   * Delete all selected shapes
   */
  const bulkDelete = useCallback((): void => {
    const idsToDelete = Array.from(selectedIds)
    
    // Update local state immediately
    setShapes((prev) => prev.filter((shape) => !selectedIds.has(shape.id)))
    
    // Clear selection
    clearSelection()
    
    // Remove from local shapes tracking
    idsToDelete.forEach((id) => localShapesRef.current.delete(id))
    
    // Sync to Firebase (only if user is authenticated)
    if (syncEnabled && userId && idsToDelete.length > 0) {
      syncBulkDelete(canvasId, idsToDelete).catch((error) => {
        console.error('Failed to sync bulk delete:', error)
      })
    }
  }, [selectedIds, syncEnabled, canvasId, userId, clearSelection])

  /**
   * Copy selected shapes to in-memory clipboard (PR-13)
   */
  const copySelected = useCallback((): void => {
    const selectedShapes = getSelectedShapes()
    if (selectedShapes.length > 0) {
      copyShapesToClipboard(selectedShapes)
    }
  }, [getSelectedShapes])

  /**
   * Paste shapes from clipboard with offset (PR-13)
   * Auto-selects pasted shapes
   */
  const paste = useCallback((): void => {
    const pastedShapes = pasteShapesFromClipboard()
    
    if (pastedShapes.length === 0) {
      return
    }

    // Add to local state immediately
    setShapes((prev) => [...prev, ...pastedShapes])
    
    // Mark all as locally created
    pastedShapes.forEach((shape) => {
      localShapesRef.current.add(shape.id)
    })
    
    // Auto-select pasted shapes
    selectMultiple(pastedShapes.map((s) => s.id))
    
    // Sync to Firebase (only if user is authenticated)
    if (syncEnabled && userId) {
      // Use batch create for efficient multi-shape sync
      syncBatchCreate(canvasId, pastedShapes).catch((error) => {
        console.error('Failed to sync pasted shapes:', error)
      })
    }
  }, [syncEnabled, canvasId, userId, selectMultiple])

  /**
   * Duplicate selected shapes with offset (PR-13)
   * Auto-selects duplicated shapes
   */
  const duplicateSelected = useCallback((): void => {
    const selectedShapes = getSelectedShapes()
    const duplicatedShapes = duplicateShapesInternal(selectedShapes)
    
    if (duplicatedShapes.length === 0) {
      return
    }

    // Add to local state immediately
    setShapes((prev) => [...prev, ...duplicatedShapes])
    
    // Mark all as locally created
    duplicatedShapes.forEach((shape) => {
      localShapesRef.current.add(shape.id)
    })
    
    // Auto-select duplicated shapes
    selectMultiple(duplicatedShapes.map((s) => s.id))
    
    // Sync to Firebase (only if user is authenticated)
    if (syncEnabled && userId) {
      // Use batch create for efficient multi-shape sync
      syncBatchCreate(canvasId, duplicatedShapes).catch((error) => {
        console.error('Failed to sync duplicated shapes:', error)
      })
    }
  }, [getSelectedShapes, syncEnabled, canvasId, userId, selectMultiple])

  /**
   * Add color to recent colors list (PR-15)
   * Maintains max 5 colors, most recent first
   */
  const addRecentColor = useCallback((color: string): void => {
    setRecentColors((prev) => {
      // Remove color if it already exists
      const filtered = prev.filter((c) => c.toUpperCase() !== color.toUpperCase())
      // Add to front and limit to 5
      return [color, ...filtered].slice(0, 5)
    })
  }, [])

  /**
   * Get recent colors (PR-15)
   */
  const getRecentColors = useCallback((): string[] => {
    return recentColors
  }, [recentColors])

  /**
   * Update colors for selected shapes (PR-15)
   * Updates fill, stroke, and strokeWidth for all selected shapes
   */
  const updateColors = useCallback(
    (fill?: string, stroke?: string, strokeWidth?: number): void => {
      const selectedShapesList = getSelectedShapes()
      if (selectedShapesList.length === 0) return

      // Build updates object
      const updates: Partial<Shape> = {}
      if (fill !== undefined) updates.fill = fill
      if (stroke !== undefined) updates.stroke = stroke
      if (strokeWidth !== undefined) updates.strokeWidth = strokeWidth

      // Update all selected shapes
      selectedShapesList.forEach((shape) => {
        updateShape(shape.id, updates)
      })

      // Add fill color to recent colors if provided
      if (fill !== undefined) {
        addRecentColor(fill)
      }
    },
    [getSelectedShapes, updateShape, addRecentColor]
  )

  /**
   * Undo the last command (PR-14)
   */
  const undo = useCallback((): void => {
    historyManager.undo()
    // Update undo/redo availability
    setCanUndo(historyManager.canUndo())
    setCanRedo(historyManager.canRedo())
  }, [historyManager])

  /**
   * Redo the last undone command (PR-14)
   */
  const redo = useCallback((): void => {
    historyManager.redo()
    // Update undo/redo availability
    setCanUndo(historyManager.canUndo())
    setCanRedo(historyManager.canRedo())
  }, [historyManager])

  /**
   * Sort shapes by z-index (PR-17)
   * Returns a new array sorted by z-index (lowest first, highest last)
   */
  const sortShapesByZIndex = useCallback((): Shape[] => {
    return [...shapes].sort((a, b) => {
      const aZ = a.zIndex ?? 0
      const bZ = b.zIndex ?? 0
      return aZ - bZ
    })
  }, [shapes])

  /**
   * Bring shapes to front (PR-17)
   * Sets z-index to max+1 for all selected shapes (or provided ids)
   * Multi-select: maintains relative order among selected shapes
   */
  const bringToFront = useCallback(
    (ids?: string[]): void => {
      const targetIds = ids || Array.from(selectedIds)
      if (targetIds.length === 0) return

      // Find max z-index
      const maxZ = Math.max(...shapes.map((s) => s.zIndex ?? 0))
      
      // Create old/new z-index maps for undo
      const oldZIndices = new Map<string, number>()
      const newZIndices = new Map<string, number>()
      
      // Sort target shapes by current z-index to maintain relative order
      const targetShapes = shapes.filter((s) => targetIds.includes(s.id))
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
      
      // Assign new z-indices starting from maxZ + 1
      targetShapes.forEach((shape, index) => {
        oldZIndices.set(shape.id, shape.zIndex ?? 0)
        newZIndices.set(shape.id, maxZ + 1 + index)
      })

      // Create command for this operation
      const command = new ZIndexCommand(
        targetIds,
        oldZIndices,
        newZIndices,
        (id, updates) => updateShape(id, updates),
        (id, zIndex) => syncEnabled && userId ? syncZIndex(canvasId, id, zIndex) : Promise.resolve()
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
    },
    [selectedIds, shapes, historyManager, updateShape, syncEnabled, userId, canvasId, updateHistoryState]
  )

  /**
   * Send shapes to back (PR-17)
   * Sets z-index to min-1 for all selected shapes (or provided ids)
   * Multi-select: maintains relative order among selected shapes
   */
  const sendToBack = useCallback(
    (ids?: string[]): void => {
      const targetIds = ids || Array.from(selectedIds)
      if (targetIds.length === 0) return

      // Find min z-index
      const minZ = Math.min(...shapes.map((s) => s.zIndex ?? 0))
      
      // Create old/new z-index maps for undo
      const oldZIndices = new Map<string, number>()
      const newZIndices = new Map<string, number>()
      
      // Sort target shapes by current z-index to maintain relative order
      const targetShapes = shapes.filter((s) => targetIds.includes(s.id))
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
      
      // Assign new z-indices starting from minZ - targetShapes.length
      targetShapes.forEach((shape, index) => {
        oldZIndices.set(shape.id, shape.zIndex ?? 0)
        newZIndices.set(shape.id, minZ - targetShapes.length + index)
      })

      // Create command for this operation
      const command = new ZIndexCommand(
        targetIds,
        oldZIndices,
        newZIndices,
        (id, updates) => updateShape(id, updates),
        (id, zIndex) => syncEnabled && userId ? syncZIndex(canvasId, id, zIndex) : Promise.resolve()
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
    },
    [selectedIds, shapes, historyManager, updateShape, syncEnabled, userId, canvasId, updateHistoryState]
  )

  /**
   * Bring shapes forward by one layer (PR-17)
   * Increments z-index by swapping with the shape above
   */
  const bringForward = useCallback(
    (ids?: string[]): void => {
      const targetIds = ids || Array.from(selectedIds)
      if (targetIds.length === 0) return

      // Sort all shapes by z-index
      const sortedShapes = sortShapesByZIndex()
      
      // Create old/new z-index maps
      const oldZIndices = new Map<string, number>()
      const newZIndices = new Map<string, number>()
      
      // For each target shape, swap with the shape above it
      targetIds.forEach((id) => {
        const currentIndex = sortedShapes.findIndex((s) => s.id === id)
        if (currentIndex < sortedShapes.length - 1) {
          const currentShape = sortedShapes[currentIndex]
          const nextShape = sortedShapes[currentIndex + 1]
          
          if (!targetIds.includes(nextShape.id)) {
            // Only swap if the next shape is not also being moved
            oldZIndices.set(currentShape.id, currentShape.zIndex ?? 0)
            newZIndices.set(currentShape.id, nextShape.zIndex ?? 0)
            oldZIndices.set(nextShape.id, nextShape.zIndex ?? 0)
            newZIndices.set(nextShape.id, currentShape.zIndex ?? 0)
          }
        }
      })

      if (newZIndices.size === 0) return // Nothing to do

      // Create command for this operation
      const command = new ZIndexCommand(
        Array.from(newZIndices.keys()),
        oldZIndices,
        newZIndices,
        (id, updates) => updateShape(id, updates),
        (id, zIndex) => syncEnabled && userId ? syncZIndex(canvasId, id, zIndex) : Promise.resolve()
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
    },
    [selectedIds, shapes, sortShapesByZIndex, historyManager, updateShape, syncEnabled, userId, canvasId, updateHistoryState]
  )

  /**
   * Send shapes backward by one layer (PR-17)
   * Decrements z-index by swapping with the shape below
   */
  const sendBackward = useCallback(
    (ids?: string[]): void => {
      const targetIds = ids || Array.from(selectedIds)
      if (targetIds.length === 0) return

      // Sort all shapes by z-index
      const sortedShapes = sortShapesByZIndex()
      
      // Create old/new z-index maps
      const oldZIndices = new Map<string, number>()
      const newZIndices = new Map<string, number>()
      
      // For each target shape, swap with the shape below it
      targetIds.forEach((id) => {
        const currentIndex = sortedShapes.findIndex((s) => s.id === id)
        if (currentIndex > 0) {
          const currentShape = sortedShapes[currentIndex]
          const prevShape = sortedShapes[currentIndex - 1]
          
          if (!targetIds.includes(prevShape.id)) {
            // Only swap if the previous shape is not also being moved
            oldZIndices.set(currentShape.id, currentShape.zIndex ?? 0)
            newZIndices.set(currentShape.id, prevShape.zIndex ?? 0)
            oldZIndices.set(prevShape.id, prevShape.zIndex ?? 0)
            newZIndices.set(prevShape.id, currentShape.zIndex ?? 0)
          }
        }
      })

      if (newZIndices.size === 0) return // Nothing to do

      // Create command for this operation
      const command = new ZIndexCommand(
        Array.from(newZIndices.keys()),
        oldZIndices,
        newZIndices,
        (id, updates) => updateShape(id, updates),
        (id, zIndex) => syncEnabled && userId ? syncZIndex(canvasId, id, zIndex) : Promise.resolve()
      )
      
      historyManager.executeCommand(command)
      updateHistoryState()
    },
    [selectedIds, shapes, sortShapesByZIndex, historyManager, updateShape, syncEnabled, userId, canvasId, updateHistoryState]
  )

  /**
   * Persist recent colors to localStorage (PR-15)
   */
  useEffect(() => {
    saveRecentColors(recentColors)
  }, [recentColors])

  /**
   * Subscribe to Firebase updates from other users
   */
  useEffect(() => {
    // Don't subscribe if sync is disabled or user is not authenticated
    if (!syncEnabled || !userId) return

    const unsubscribe = subscribeToCanvas(canvasId, {
      onCreate: (shape) => {
        // Only add if not created locally
        if (!localShapesRef.current.has(shape.id)) {
          setShapes((prev) => {
            // Avoid duplicates
            if (prev.some((s) => s.id === shape.id)) {
              return prev
            }
            return [...prev, shape]
          })
        }
      },
      onUpdate: (shapeId, updates) => {
        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === shapeId ? { ...shape, ...updates } : shape
          )
        )
      },
      onDelete: (shapeId) => {
        setShapes((prev) => prev.filter((shape) => shape.id !== shapeId))
        setSelectedId((prev) => (prev === shapeId ? null : prev))
        // Remove from selectedIds if it was selected
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(shapeId)
          return next
        })
        localShapesRef.current.delete(shapeId)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [syncEnabled, canvasId, userId])

  return {
    shapes,
    selectedId,
    selectedIds,
    addShape,
    addText,
    updateShape,
    deleteShape,
    setSelection,
    toggleSelection,
    selectMultiple,
    clearSelection,
    selectAll,
    getSelectedShapes,
    bulkMove,
    bulkDelete,
    copySelected,
    paste,
    duplicateSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    updateColors,
    getRecentColors,
    addRecentColor,
    addLine,
    addPolygon,
    addStar,
    addRoundedRect,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    sortShapesByZIndex,
  }
}

