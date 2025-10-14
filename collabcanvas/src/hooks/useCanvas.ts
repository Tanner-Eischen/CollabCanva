import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Shape, ShapeType } from '../types/canvas'
import { DEFAULT_CANVAS_CONFIG } from '../types/canvas'

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
 * Hook for managing canvas shapes state
 * Handles shape creation, updates, deletion, and selection
 */
export function useCanvas(): UseCanvasReturn {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

      setShapes((prev) => [...prev, newShape])
      return id
    },
    []
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

      setShapes((prev) => [...prev, newShape])
      return id
    },
    []
  )

  /**
   * Update shape properties (mainly position for MVP)
   */
  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>): void => {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape
        )
      )
    },
    []
  )

  /**
   * Delete a shape and clear selection if it was selected
   */
  const deleteShape = useCallback(
    (id: string): void => {
      setShapes((prev) => prev.filter((shape) => shape.id !== id))
      setSelectedId((prev) => (prev === id ? null : prev))
    },
    []
  )

  /**
   * Set selected shape ID
   * Selection state will be synced via presence in PR-7
   */
  const setSelection = useCallback((id: string | null): void => {
    setSelectedId(id)
  }, [])

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

