/**
 * Layer Management Hook
 * React Context-based layer state management for tilemap editing
 * Uses standard React hooks (no external state management library)
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { TileLayerMeta } from '../types/tileLayer'

interface LayerContextState {
  // Active layer selection
  activeLayerId: string | null
  setActiveLayer: (layerId: string) => void
  
  // Layer panel visibility
  isPanelOpen: boolean
  togglePanel: () => void
  setPanel: (open: boolean) => void
  
  // Layer list (synced from Firebase)
  layers: TileLayerMeta[]
  setLayers: (layers: TileLayerMeta[]) => void
  
  // Layer operations
  updateLayer: (layerId: string, updates: Partial<TileLayerMeta>) => void
  reorderLayer: (layerId: string, newZ: number) => void
  
  // Helpers
  getActiveLayer: () => TileLayerMeta | null
  getLayerById: (layerId: string) => TileLayerMeta | null
}

const LayerContext = createContext<LayerContextState | undefined>(undefined)

/**
 * Layer Management Provider
 * Wrap your app with this provider to enable layer management
 */
export function LayerProvider({ children }: { children: ReactNode }) {
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [layers, setLayersState] = useState<TileLayerMeta[]>([])

  // Set active layer
  const setActiveLayer = useCallback((layerId: string) => {
    setActiveLayerId(layerId)
  }, [])

  // Panel controls
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev)
  }, [])

  const setPanel = useCallback((open: boolean) => {
    setIsPanelOpen(open)
  }, [])

  // Set layers from Firebase with auto-selection
  const setLayers = useCallback((newLayers: TileLayerMeta[]) => {
    setLayersState(newLayers)
    
    // Auto-select first visible layer if no layer selected
    setActiveLayerId(prevId => {
      if (!prevId && newLayers.length > 0) {
        const firstVisible = newLayers.find(l => l.visible) || newLayers[0]
        return firstVisible.id
      }
      return prevId
    })
  }, [])

  // Update a specific layer (local state only)
  const updateLayer = useCallback((layerId: string, updates: Partial<TileLayerMeta>) => {
    setLayersState(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      )
    )
  }, [])

  // Reorder layer by changing its z-index
  const reorderLayer = useCallback((layerId: string, newZ: number) => {
    setLayersState(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, z: newZ } : layer
      )
    )
  }, [])

  // Get active layer object
  const getActiveLayer = useCallback((): TileLayerMeta | null => {
    return layers.find(l => l.id === activeLayerId) || null
  }, [layers, activeLayerId])

  // Get layer by ID
  const getLayerById = useCallback((layerId: string): TileLayerMeta | null => {
    return layers.find(l => l.id === layerId) || null
  }, [layers])

  const value = useMemo(() => ({
    activeLayerId,
    setActiveLayer,
    isPanelOpen,
    togglePanel,
    setPanel,
    layers,
    setLayers,
    updateLayer,
    reorderLayer,
    getActiveLayer,
    getLayerById,
  }), [
    activeLayerId,
    setActiveLayer,
    isPanelOpen,
    togglePanel,
    setPanel,
    layers,
    setLayers,
    updateLayer,
    reorderLayer,
    getActiveLayer,
    getLayerById,
  ])

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  )
}

/**
 * Hook to use layer management context
 * Must be used within a LayerProvider
 */
export function useLayerContext(): LayerContextState {
  const context = useContext(LayerContext)
  if (!context) {
    throw new Error('useLayerContext must be used within a LayerProvider')
  }
  return context
}

/**
 * Hook to get active layer with type safety
 */
export function useActiveLayer(): TileLayerMeta | null {
  const { getActiveLayer } = useLayerContext()
  return getActiveLayer()
}

/**
 * Hook to get visible layers sorted by z-index
 */
export function useVisibleLayers(): TileLayerMeta[] {
  const { layers } = useLayerContext()
  return useMemo(
    () => layers
      .filter(l => l.visible)
      .sort((a, b) => a.z - b.z),
    [layers]
  )
}

/**
 * Hook to get all layers sorted by z-index (including hidden)
 */
export function useSortedLayers(): TileLayerMeta[] {
  const { layers } = useLayerContext()
  return useMemo(
    () => [...layers].sort((a, b) => a.z - b.z),
    [layers]
  )
}

