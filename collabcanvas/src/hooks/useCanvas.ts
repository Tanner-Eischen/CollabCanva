import { useState, useCallback, useEffect, useRef } from 'react'
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
  subscribeToCanvas,
} from '../services/canvasSync'
import {
  copyShapes as copyShapesToClipboard,
  pasteShapes as pasteShapesFromClipboard,
  duplicateShapes as duplicateShapesInternal,
} from '../services/clipboard'

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

  /**
   * Add a rectangle or circle shape
   * All shapes are fixed 100x100px, blue (#3B82F6)
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
      }

      // Add to local state immediately
      setShapes((prev) => [...prev, newShape])
      
      // Mark as locally created
      localShapesRef.current.add(id)
      
      // Sync to Firebase (only if user is authenticated)
      if (syncEnabled && userId) {
        syncCreateShape(canvasId, id, newShape).catch((error) => {
          console.error('Failed to sync shape creation:', error)
        })
      }
      
      return id
    },
    [syncEnabled, canvasId, userId]
  )

  /**
   * Add a text shape
   * Validates that text is not empty (min 1 character)
   * Auto-calculates dimensions based on content
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
      }

      // Add to local state immediately
      setShapes((prev) => [...prev, newShape])
      
      // Mark as locally created
      localShapesRef.current.add(id)
      
      // Sync to Firebase (only if user is authenticated)
      if (syncEnabled && userId) {
        syncCreateShape(canvasId, id, newShape).catch((error) => {
          console.error('Failed to sync text creation:', error)
        })
      }
      
      return id
    },
    [syncEnabled, canvasId, userId]
  )

  /**
   * Update shape properties (position, dimensions, rotation)
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
        updates.rotation !== undefined
      
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
   */
  const deleteShape = useCallback(
    (id: string): void => {
      // Update local state immediately
      setShapes((prev) => prev.filter((shape) => shape.id !== id))
      setSelectedId((prev) => (prev === id ? null : prev))
      
      // Remove from selectedIds if it was selected
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      
      // Remove from local shapes tracking
      localShapesRef.current.delete(id)
      
      // Sync to Firebase (only if user is authenticated)
      if (syncEnabled && userId) {
        syncDeleteShape(canvasId, id).catch((error) => {
          console.error('Failed to sync shape deletion:', error)
        })
      }
    },
    [syncEnabled, canvasId, userId]
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
  }
}

