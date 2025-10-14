import { useState, useCallback, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Shape, ShapeType } from '../types/canvas'
import { DEFAULT_CANVAS_CONFIG } from '../types/canvas'
import {
  syncCreateShape,
  syncUpdateShape,
  syncDeleteShape,
  subscribeToCanvas,
} from '../services/canvasSync'

interface UseCanvasOptions {
  canvasId: string
  userId: string
  enableSync?: boolean
}

interface UseCanvasReturn {
  shapes: Shape[]
  selectedId: string | null
  addShape: (type: 'rectangle' | 'circle', x: number, y: number) => string
  addText: (text: string, x: number, y: number) => string | null
  updateShape: (id: string, updates: Partial<Shape>) => void
  deleteShape: (id: string) => void
  setSelection: (id: string | null) => void
}

/**
 * Hook for managing canvas shapes state with Firebase sync
 * Handles shape creation, updates, deletion, and selection
 */
export function useCanvas(options?: UseCanvasOptions): UseCanvasReturn {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const syncEnabled = options?.enableSync ?? true
  const canvasId = options?.canvasId ?? 'default-canvas'
  
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
      
      // Sync to Firebase
      if (syncEnabled) {
        syncCreateShape(canvasId, id, newShape).catch((error) => {
          console.error('Failed to sync shape creation:', error)
        })
      }
      
      return id
    },
    [syncEnabled, canvasId]
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
      
      // Sync to Firebase
      if (syncEnabled) {
        syncCreateShape(canvasId, id, newShape).catch((error) => {
          console.error('Failed to sync text creation:', error)
        })
      }
      
      return id
    },
    [syncEnabled, canvasId]
  )

  /**
   * Update shape properties (mainly position for MVP)
   */
  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>): void => {
      // Update local state immediately
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape
        )
      )
      
      // Sync to Firebase (only position for MVP)
      if (syncEnabled && (updates.x !== undefined || updates.y !== undefined)) {
        syncUpdateShape(canvasId, id, updates).catch((error) => {
          console.error('Failed to sync shape update:', error)
        })
      }
    },
    [syncEnabled, canvasId]
  )

  /**
   * Delete a shape and clear selection if it was selected
   */
  const deleteShape = useCallback(
    (id: string): void => {
      // Update local state immediately
      setShapes((prev) => prev.filter((shape) => shape.id !== id))
      setSelectedId((prev) => (prev === id ? null : prev))
      
      // Remove from local shapes tracking
      localShapesRef.current.delete(id)
      
      // Sync to Firebase
      if (syncEnabled) {
        syncDeleteShape(canvasId, id).catch((error) => {
          console.error('Failed to sync shape deletion:', error)
        })
      }
    },
    [syncEnabled, canvasId]
  )

  /**
   * Set selected shape ID
   * Selection state is synced via presence (handled in Canvas component)
   */
  const setSelection = useCallback((id: string | null): void => {
    setSelectedId(id)
  }, [])

  /**
   * Subscribe to Firebase updates from other users
   */
  useEffect(() => {
    if (!syncEnabled) return

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
        localShapesRef.current.delete(shapeId)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [syncEnabled, canvasId])

  return {
    shapes,
    selectedId,
    addShape,
    addText,
    updateShape,
    deleteShape,
    setSelection,
  }
}

