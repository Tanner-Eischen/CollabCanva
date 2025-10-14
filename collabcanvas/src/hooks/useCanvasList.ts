/**
 * useCanvasList Hook (PR-22)
 * Manages canvas list state with real-time Firebase updates
 */

import { useState, useEffect, useCallback } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '../services/firebase'
import {
  createCanvas as createCanvasService,
  deleteCanvas as deleteCanvasService,
  duplicateCanvas as duplicateCanvasService,
  updateCanvas as updateCanvasService,
  type CanvasMetadata,
} from '../services/canvasManager'
import { useNavigate } from 'react-router-dom'

interface UseCanvasListReturn {
  canvases: CanvasMetadata[]
  loading: boolean
  error: string | null
  createCanvas: (name: string) => Promise<void>
  deleteCanvas: (canvasId: string) => Promise<void>
  duplicateCanvas: (canvasId: string) => Promise<void>
  updateCanvasName: (canvasId: string, name: string) => Promise<void>
  refreshCanvases: () => void
}

/**
 * Hook for managing user's canvas list
 * Subscribes to real-time updates from Firebase
 */
export function useCanvasList(userId: string): UseCanvasListReturn {
  const [canvases, setCanvases] = useState<CanvasMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Subscribe to user's canvases
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const canvasesRef = ref(db, `users/${userId}/canvases`)

    const handleValue = (snapshot: any) => {
      try {
        if (!snapshot.exists()) {
          setCanvases([])
          setLoading(false)
          return
        }

        const canvasesData = snapshot.val()
        const canvasList: CanvasMetadata[] = Object.values(canvasesData)

        // Sort by updatedAt (most recent first)
        canvasList.sort((a, b) => b.updatedAt - a.updatedAt)

        setCanvases(canvasList)
        setError(null)
      } catch (err) {
        console.error('Error processing canvases:', err)
        setError('Failed to load canvases')
      } finally {
        setLoading(false)
      }
    }

    const handleError = (err: Error) => {
      console.error('Firebase error:', err)
      setError('Failed to connect to database')
      setLoading(false)
    }

    onValue(canvasesRef, handleValue, handleError)

    // Cleanup subscription on unmount
    return () => {
      off(canvasesRef, 'value', handleValue)
    }
  }, [userId])

  /**
   * Create new canvas and navigate to it
   */
  const createCanvas = useCallback(
    async (name: string) => {
      try {
        setError(null)
        const canvas = await createCanvasService(name, userId)
        console.log('Canvas created:', canvas.id)
        
        // Navigate to the new canvas
        navigate(`/canvas/${canvas.id}`)
      } catch (err) {
        console.error('Error creating canvas:', err)
        setError('Failed to create canvas')
        throw err
      }
    },
    [userId, navigate]
  )

  /**
   * Delete canvas
   */
  const deleteCanvas = useCallback(
    async (canvasId: string) => {
      try {
        setError(null)
        await deleteCanvasService(canvasId, userId)
        console.log('Canvas deleted:', canvasId)
      } catch (err) {
        console.error('Error deleting canvas:', err)
        setError('Failed to delete canvas')
        throw err
      }
    },
    [userId]
  )

  /**
   * Duplicate canvas (clone with all objects)
   */
  const duplicateCanvas = useCallback(
    async (canvasId: string) => {
      try {
        setError(null)
        const duplicatedCanvas = await duplicateCanvasService(canvasId, userId)
        console.log('Canvas duplicated:', duplicatedCanvas.id)
      } catch (err) {
        console.error('Error duplicating canvas:', err)
        setError('Failed to duplicate canvas')
        throw err
      }
    },
    [userId]
  )

  /**
   * Update canvas name
   */
  const updateCanvasName = useCallback(
    async (canvasId: string, name: string) => {
      try {
        setError(null)
        await updateCanvasService(canvasId, userId, { name })
        console.log('Canvas renamed:', canvasId)
      } catch (err) {
        console.error('Error updating canvas name:', err)
        setError('Failed to update canvas name')
        throw err
      }
    },
    [userId]
  )

  /**
   * Force refresh canvases (manual trigger)
   */
  const refreshCanvases = useCallback(() => {
    // Firebase onValue automatically updates, but we can trigger re-subscription
    setLoading(true)
  }, [])

  return {
    canvases,
    loading,
    error,
    createCanvas,
    deleteCanvas,
    duplicateCanvas,
    updateCanvasName,
    refreshCanvases,
  }
}

