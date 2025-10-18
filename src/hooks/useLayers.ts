/**
 * useLayers Hook (PR-19)
 * Hook for managing layer state, visibility, locking, and z-index reordering
 */

import { useState, useCallback, useEffect } from 'react'
import { ref, onValue, off, update } from 'firebase/database'
import { db } from '../services/firebase'
import type { LayerVisibility, LayerLock } from '../types/layer'
import type { Shape } from '../types/canvas'

interface UseLayersOptions {
  canvasId: string
  enableSync?: boolean
}

interface UseLayersReturn {
  visibility: LayerVisibility
  locks: LayerLock
  toggleVisibility: (objectId: string) => Promise<void>
  toggleLock: (objectId: string) => Promise<void>
  setVisibility: (objectId: string, visible: boolean) => Promise<void>
  setLock: (objectId: string, locked: boolean) => Promise<void>
  reorderLayers: (fromIndex: number, toIndex: number, shapes: Shape[]) => Promise<void>
  isVisible: (objectId: string) => boolean
  isLocked: (objectId: string) => boolean
}

/**
 * Hook for managing layer visibility, locking, and z-index
 * Syncs with Firebase for real-time collaboration
 */
export function useLayers(options?: UseLayersOptions): UseLayersReturn {
  const [visibility, setVisibilityState] = useState<LayerVisibility>({})
  const [locks, setLocksState] = useState<LayerLock>({})
  const syncEnabled = options?.enableSync ?? true
  const canvasId = options?.canvasId ?? 'default-canvas'

  /**
   * Subscribe to visibility changes from Firebase
   */
  useEffect(() => {
    if (!syncEnabled) return

    const visibilityRef = ref(db, `canvases/${canvasId}/visibility`)
    const locksRef = ref(db, `canvases/${canvasId}/locks`)

    const normalizeBooleanMap = (value: any): Record<string, boolean> => {
      if (!value || typeof value !== 'object') return {}

      const normalized: Record<string, boolean> = {}
      Object.entries(value).forEach(([key, entry]) => {
        if (typeof entry === 'boolean') {
          normalized[key] = entry
        } else if (entry && typeof entry === 'object' && 'value' in entry) {
          normalized[key] = Boolean((entry as { value: unknown }).value)
        }
      })
      return normalized
    }

    const handleVisibilityChange = (snapshot: any) => {
      if (snapshot.exists()) {
        const value = snapshot.val()
        setVisibilityState(normalizeBooleanMap(value))
      } else {
        setVisibilityState({})
      }
    }

    const handleLocksChange = (snapshot: any) => {
      if (snapshot.exists()) {
        const value = snapshot.val()
        setLocksState(normalizeBooleanMap(value))
      } else {
        setLocksState({})
      }
    }

    onValue(visibilityRef, handleVisibilityChange)
    onValue(locksRef, handleLocksChange)

    return () => {
      off(visibilityRef, 'value', handleVisibilityChange)
      off(locksRef, 'value', handleLocksChange)
    }
  }, [canvasId, syncEnabled])

  /**
   * Toggle visibility for an object
   */
  const toggleVisibility = useCallback(
    async (objectId: string): Promise<void> => {
      const currentVisibility = visibility[objectId] !== false // default to visible
      const newVisibility = !currentVisibility

      if (syncEnabled) {
        const visibilityRef = ref(db, `canvases/${canvasId}/visibility`)
        await update(visibilityRef, { [objectId]: newVisibility })
      }

      setVisibilityState((prev) => ({
        ...prev,
        [objectId]: newVisibility,
      }))
    },
    [canvasId, syncEnabled, visibility]
  )

  /**
   * Toggle lock for an object
   */
  const toggleLock = useCallback(
    async (objectId: string): Promise<void> => {
      const currentLock = locks[objectId] === true // default to unlocked
      const newLock = !currentLock

      if (syncEnabled) {
        const lockRef = ref(db, `canvases/${canvasId}/locks`)
        await update(lockRef, { [objectId]: newLock })
      }

      setLocksState((prev) => ({
        ...prev,
        [objectId]: newLock,
      }))
    },
    [canvasId, syncEnabled, locks]
  )

  /**
   * Set visibility for an object
   */
  const setVisibility = useCallback(
    async (objectId: string, visible: boolean): Promise<void> => {
      if (syncEnabled) {
        const visibilityRef = ref(db, `canvases/${canvasId}/visibility`)
        await update(visibilityRef, { [objectId]: visible })
      }

      setVisibilityState((prev) => ({
        ...prev,
        [objectId]: visible,
      }))
    },
    [canvasId, syncEnabled]
  )

  /**
   * Set lock for an object
   */
  const setLock = useCallback(
    async (objectId: string, locked: boolean): Promise<void> => {
      if (syncEnabled) {
        const lockRef = ref(db, `canvases/${canvasId}/locks`)
        await update(lockRef, { [objectId]: locked })
      }

      setLocksState((prev) => ({
        ...prev,
        [objectId]: locked,
      }))
    },
    [canvasId, syncEnabled]
  )

  /**
   * Reorder layers by changing z-index
   */
  const reorderLayers = useCallback(
    async (fromIndex: number, toIndex: number, shapes: Shape[]): Promise<void> => {
      if (fromIndex === toIndex) return

      // Reorder the shapes array
      const reordered = [...shapes]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, moved)

      // Update z-index for all shapes
      const updates: { [key: string]: any } = {}
      reordered.forEach((shape, index) => {
        if (syncEnabled) {
          updates[`canvases/${canvasId}/objects/${shape.id}/zIndex`] = index
        }
      })

      if (syncEnabled && Object.keys(updates).length > 0) {
        await update(ref(db), updates)
      }
    },
    [canvasId, syncEnabled]
  )

  /**
   * Check if an object is visible
   */
  const isVisible = useCallback(
    (objectId: string): boolean => {
      return visibility[objectId] !== false // default to visible
    },
    [visibility]
  )

  /**
   * Check if an object is locked
   */
  const isLocked = useCallback(
    (objectId: string): boolean => {
      return locks[objectId] === true // default to unlocked
    },
    [locks]
  )

  return {
    visibility,
    locks,
    toggleVisibility,
    toggleLock,
    setVisibility,
    setLock,
    reorderLayers,
    isVisible,
    isLocked,
  }
}

