/**
 * AI Orchestrator Hook (React Context)
 * Manages AI-driven tilemap operations with async execution
 * PR-34: AI Tilemap Orchestration
 * 
 * NOTE: Uses React Context pattern (NOT Zustand), following existing codebase patterns
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { sendAICommand, type AIRequest, type AIResponse } from '../services/ai/ai'
import {
  createAILayerExecutor,
  parseAIResponseToActions,
  type AILayerAction,
  type AIActionResult,
} from '../services/ai/aiLayerActions'
import { coordToKey, type TileData, type TilemapMeta } from '../types/tilemap'
import type { AssetAIContextPayload } from '../types/asset'
import { hasSpriteAsset } from '../constants/tilemapDefaults'
import { calculateAutoTileUpdates } from '../utils/tilemap/autoTile'

/**
 * AI Orchestration State
 */
interface AIOrchestrationState {
  isExecuting: boolean
  currentAction: AILayerAction | null
  executionHistory: AIActionResult[]
  previewTiles: Array<{ x: number; y: number; tile: any }> | null
  error: string | null
}

/**
 * AI Orchestrator Context
 */
interface AIOrchestratorContextState extends AIOrchestrationState {
  // Execute AI command
  executeAICommand: (
    message: string,
    context: {
      canvasId: string
      userId: string
      tilemapMeta: TilemapMeta
      viewport: any
      assetContext?: AssetAIContextPayload
    }
  ) => Promise<AIResponse>

  // Execute actions with preview
  executeWithPreview: (
    actions: AILayerAction[],
    canvasId: string,
    userId: string
  ) => Promise<AIActionResult[]>

  // Clear preview
  clearPreview: () => void

  // Undo last action
  undoLastAction: () => Promise<boolean>

  // Modify last action
  modifyLastAction: (modifications: Partial<AILayerAction>) => Promise<boolean>

  // Clear execution history
  clearHistory: () => void

  // Set error
  setError: (error: string | null) => void

  // Register tilemap state provider (for auto-tiling integration)
  registerTileState: (provider: TileStateProvider | null) => () => void
}

const AIOrchestratorContext = createContext<AIOrchestratorContextState | undefined>(undefined)

/**
 * AI Orchestrator Provider
 */
export function AIOrchestratorProvider({ children }: { children: ReactNode }) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentAction, setCurrentAction] = useState<AILayerAction | null>(null)
  const [executionHistory, setExecutionHistory] = useState<AIActionResult[]>([])
  const [previewTiles, setPreviewTiles] = useState<Array<{ x: number; y: number; tile: any }> | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Executor instances cache
  const executorsRef = useRef<Map<string, ReturnType<typeof createAILayerExecutor>>>(new Map())
  const tileStateRef = useRef<TileStateProvider | null>(null)

  /**
   * Get or create executor for canvas
   */
  const getExecutor = useCallback((canvasId: string, userId: string) => {
    const key = `${canvasId}-${userId}`
    if (!executorsRef.current.has(key)) {
      executorsRef.current.set(key, createAILayerExecutor(canvasId, userId))
    }
    return executorsRef.current.get(key)!
  }, [])

  /**
   * Execute AI command and return response
   */
  const executeAICommand = useCallback(
    async (
      message: string,
      context: {
        canvasId: string
        userId: string
        tilemapMeta: TilemapMeta
        viewport: any
        assetContext?: AssetAIContextPayload
      }
    ): Promise<AIResponse> => {
      setIsExecuting(true)
      setError(null)

      try {
        const request: AIRequest = {
          message,
          context: {
            canvasId: context.canvasId,
            userId: context.userId,
            selectedShapes: [],
            viewport: context.viewport,
            mode: 'tilemap',
            tilemapMeta: context.tilemapMeta,
            availableAssets: context.assetContext?.availableAssets,
            assetStats: context.assetContext?.assetStats,
            tilesetSuggestions: context.assetContext?.tilesetSuggestions,
          },
        }

        const response = await sendAICommand(request)

        if (response.success && response.toolResults) {
          // Parse actions from AI response
          let actions = parseAIResponseToActions(response.toolResults, context.tilemapMeta)

          // Enhance actions with auto-tiling neighbor updates when available
          if (actions.length > 0 && tileStateRef.current) {
            actions = enhanceActionsWithAutoTiling(actions, tileStateRef.current)
          }

          if (actions.length > 0) {
            // Execute actions
            const executor = getExecutor(context.canvasId, context.userId)
            const results = await executor.executeBatch(actions)

            // Update history
            setExecutionHistory((prev) => [...prev, ...results])

            // Check for errors
            const failed = results.find((r) => !r.success)
            if (failed) {
              setError(failed.error || 'Action execution failed')
            }
          }
        } else if (!response.success) {
          setError(response.error || 'AI command failed')
        }

        return response
      } catch (err: any) {
        console.error('AI orchestration error:', err)
        setError(err.message || 'Failed to execute AI command')
        return {
          success: false,
          message: '',
          error: err.message || 'Failed to execute AI command',
        }
      } finally {
        setIsExecuting(false)
        setCurrentAction(null)
      }
    },
    [getExecutor]
  )

  /**
   * Execute actions with preview (AI-brush ghost preview)
   */
  const executeWithPreview = useCallback(
    async (
      actions: AILayerAction[],
      canvasId: string,
      userId: string
    ): Promise<AIActionResult[]> => {
      setIsExecuting(true)
      setError(null)

      try {
        const executor = getExecutor(canvasId, userId)
        const actionsToExecute =
          tileStateRef.current && actions.length > 0
            ? enhanceActionsWithAutoTiling(actions, tileStateRef.current)
            : actions
        const results: AIActionResult[] = []

        for (const action of actionsToExecute) {
          setCurrentAction(action)

          // Generate preview for paint actions
          if (action.type === 'paintTiles') {
            setPreviewTiles(action.tiles)
            // Wait a bit for preview visualization
            await new Promise((resolve) => setTimeout(resolve, 300))
          }

          // Execute action
          const result = await executor.execute(action)
          results.push(result)

          // Clear preview after execution
          setPreviewTiles(null)

          if (!result.success) {
            setError(result.error || 'Action failed')
            break
          }
        }

        // Update history
        setExecutionHistory((prev) => [...prev, ...results])

        return results
      } catch (err: any) {
        console.error('Execute with preview error:', err)
        setError(err.message)
        return []
      } finally {
        setIsExecuting(false)
        setCurrentAction(null)
        setPreviewTiles(null)
      }
    },
    [getExecutor]
  )

  /**
   * Clear preview tiles
   */
  const clearPreview = useCallback(() => {
    setPreviewTiles(null)
  }, [])

  /**
   * Undo last action
   */
  const undoLastAction = useCallback(async (): Promise<boolean> => {
    if (executionHistory.length === 0) return false

    // Get last action
    const lastResult = executionHistory[executionHistory.length - 1]
    if (!lastResult.success) return false

    try {
      // Generate inverse action
      const inverseAction = generateInverseAction(lastResult.action)
      if (!inverseAction) return false

      // Execute inverse (this would require storing original state)
      // For now, just remove from history
      setExecutionHistory((prev) => prev.slice(0, -1))

      return true
    } catch (err) {
      console.error('Undo error:', err)
      return false
    }
  }, [executionHistory])

  /**
   * Modify last action
   */
  const modifyLastAction = useCallback(
    async (modifications: Partial<AILayerAction>): Promise<boolean> => {
      if (executionHistory.length === 0) return false

      const lastResult = executionHistory[executionHistory.length - 1]
      if (!lastResult.success) return false

      try {
        // Merge modifications with last action
        const modifiedAction = { ...lastResult.action, ...modifications }

        // This would typically re-execute the modified action
        // For now, just update history
        setExecutionHistory((prev) => {
          const newHistory = [...prev]
          newHistory[newHistory.length - 1] = {
            ...lastResult,
            action: modifiedAction as AILayerAction,
          }
          return newHistory
        })

        return true
      } catch (err) {
        console.error('Modify action error:', err)
        return false
      }
    },
    [executionHistory]
  )

  /**
   * Clear execution history
   */
  const clearHistory = useCallback(() => {
    setExecutionHistory([])
    setError(null)
  }, [])

  const registerTileState = useCallback((provider: TileStateProvider | null) => {
    tileStateRef.current = provider

    return () => {
      if (tileStateRef.current === provider) {
        tileStateRef.current = null
      }
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      isExecuting,
      currentAction,
      executionHistory,
      previewTiles,
      error,
      executeAICommand,
      executeWithPreview,
      clearPreview,
      undoLastAction,
      modifyLastAction,
      clearHistory,
      setError,
      registerTileState,
    }),
    [
      isExecuting,
      currentAction,
      executionHistory,
      previewTiles,
      error,
      executeAICommand,
      executeWithPreview,
      clearPreview,
      undoLastAction,
      modifyLastAction,
      clearHistory,
      registerTileState,
    ]
  )

  return <AIOrchestratorContext.Provider value={contextValue}>{children}</AIOrchestratorContext.Provider>
}

/**
 * Use AI Orchestrator hook
 */
export function useAIOrchestrator() {
  const context = useContext(AIOrchestratorContext)
  if (context === undefined) {
    throw new Error('useAIOrchestrator must be used within AIOrchestratorProvider')
  }
  return context
}

/**
 * Helper: Generate inverse action for undo
 */
function generateInverseAction(action: AILayerAction): AILayerAction | null {
  switch (action.type) {
    case 'paintTiles':
      // Inverse of paint is erase
      return {
        type: 'eraseTiles',
        layerId: action.layerId,
        tiles: action.tiles.map((t) => ({ x: t.x, y: t.y })),
      }

    case 'eraseTiles':
      // Inverse of erase would require storing original tiles
      // For now, return null (can't undo erase without original data)
      return null

    case 'fillArea':
      // Inverse of fill is erase the same area
      return {
        type: 'eraseTiles',
        layerId: action.layerId,
        tiles: generateTilesForArea(action.x, action.y, action.width, action.height),
      }

    default:
      return null
  }
}

/**
 * Helper: Generate tile coordinates for area
 */
function generateTilesForArea(x: number, y: number, width: number, height: number): Array<{ x: number; y: number }> {
  const tiles: Array<{ x: number; y: number }> = []
  for (let tileY = y; tileY < y + height; tileY++) {
    for (let tileX = x; tileX < x + width; tileX++) {
      tiles.push({ x: tileX, y: tileY })
    }
  }
  return tiles
}

/**
 * Tilemap state provider configuration supplied by the canvas
 */
interface TileStateProvider {
  getTileMap: () => Map<string, TileData>
  isAutoTilingEnabled: () => boolean
}

/**
 * Clone a tile map so we can safely mutate it during AI execution
 */
function cloneTileMap(original: Map<string, TileData>): Map<string, TileData> {
  const clone = new Map<string, TileData>()
  original.forEach((value, key) => {
    clone.set(key, { ...value })
  })
  return clone
}

/**
 * Enhance AI actions with auto-tiling updates when the canvas provides state information
 */
function enhanceActionsWithAutoTiling(actions: AILayerAction[], provider: TileStateProvider): AILayerAction[] {
  if (!provider.isAutoTilingEnabled()) {
    return actions
  }

  const sourceMap = provider.getTileMap()
  const workingMap = cloneTileMap(sourceMap)
  const enhanced: AILayerAction[] = []

  for (const action of actions) {
    if (action.type === 'paintTiles') {
      const tilesToApply = new Map<string, { x: number; y: number; tile: TileData }>()

      // Pre-apply tiles so neighbor calculations see the latest state
      action.tiles.forEach(({ x, y, tile }) => {
        const key = coordToKey(x, y)
        workingMap.set(key, { ...tile })
        tilesToApply.set(key, { x, y, tile: { ...tile } })
      })

      // Update variants for center tiles and neighbors when needed
      action.tiles.forEach(({ x, y, tile }) => {
        if (!hasSpriteAsset(tile.type)) return

        const updates = calculateAutoTileUpdates(x, y, workingMap, tile.type)
        updates.forEach((update) => {
          const updateKey = coordToKey(update.x, update.y)
          const existing = workingMap.get(updateKey)
          if (!existing || !hasSpriteAsset(existing.type)) {
            return
          }

          if (existing.variant !== update.variant) {
            const updatedTile: TileData = { ...existing, variant: update.variant }
            workingMap.set(updateKey, updatedTile)
            tilesToApply.set(updateKey, { x: update.x, y: update.y, tile: updatedTile })
          }
        })
      })

      enhanced.push({
        ...action,
        tiles: Array.from(tilesToApply.values()),
      })
      continue
    }

    if (action.type === 'eraseTiles') {
      const neighborUpdates = new Map<string, { x: number; y: number; tile: TileData }>()

      action.tiles.forEach(({ x, y }) => {
        const key = coordToKey(x, y)
        const existing = workingMap.get(key)
        if (!existing) {
          return
        }

        workingMap.delete(key)

        if (!hasSpriteAsset(existing.type)) {
          return
        }

        const updates = calculateAutoTileUpdates(x, y, workingMap, null)
        updates.forEach((update) => {
          const updateKey = coordToKey(update.x, update.y)
          const neighbor = workingMap.get(updateKey)
          if (!neighbor || !hasSpriteAsset(neighbor.type)) {
            return
          }

          if (neighbor.variant !== update.variant) {
            const updatedTile: TileData = { ...neighbor, variant: update.variant }
            workingMap.set(updateKey, updatedTile)
            neighborUpdates.set(updateKey, { x: update.x, y: update.y, tile: updatedTile })
          }
        })
      })

      enhanced.push(action)

      if (neighborUpdates.size > 0) {
        enhanced.push({
          type: 'paintTiles',
          layerId: action.layerId,
          tiles: Array.from(neighborUpdates.values()),
        })
      }
      continue
    }

    enhanced.push(action)
  }

  return enhanced
}

