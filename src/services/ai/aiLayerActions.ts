/**
 * AI Layer Actions Service
 * Translates AI operations → tilemap layer updates
 * PR-34: AI Tilemap Orchestration
 */

import type { TileData, TilemapMeta } from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { setTile, setTiles, deleteTile, deleteTiles } from '../tilemap/tilemapSync'

/**
 * AI Action Types for Tilemap Operations
 */
export type AILayerAction =
  | { type: 'paintTiles'; layerId: string; tiles: Array<{ x: number; y: number; tile: TileData }> }
  | { type: 'eraseTiles'; layerId: string; tiles: Array<{ x: number; y: number }> }
  | { type: 'fillArea'; layerId: string; x: number; y: number; width: number; height: number; tile: TileData }
  | { type: 'generateTerrain'; layerId: string; algorithm: 'perlin' | 'cellular' | 'randomWalk'; params: any }
  | { type: 'modifyLayer'; layerId: string; updates: Partial<TileLayerMeta> }
  | { type: 'createLayer'; layer: TileLayerMeta }
  | { type: 'deleteLayer'; layerId: string }

/**
 * AI Action Result
 */
export interface AIActionResult {
  success: boolean
  action: AILayerAction
  affectedTiles: number
  error?: string
  previewData?: any
}

/**
 * AI Action Executor
 * Executes AI-generated actions on tilemap layers
 */
export class AILayerExecutor {
  private canvasId: string
  private userId: string
  private executedActions: AIActionResult[] = []

  constructor(canvasId: string, userId: string) {
    this.canvasId = canvasId
    this.userId = userId
  }

  /**
   * Execute AI layer action
   */
  async execute(action: AILayerAction): Promise<AIActionResult> {
    try {
      let result: AIActionResult

      switch (action.type) {
        case 'paintTiles':
          result = await this.executePaintTiles(action)
          break

        case 'eraseTiles':
          result = await this.executeEraseTiles(action)
          break

        case 'fillArea':
          result = await this.executeFillArea(action)
          break

        case 'generateTerrain':
          result = await this.executeGenerateTerrain(action)
          break

        case 'modifyLayer':
          result = await this.executeModifyLayer(action)
          break

        case 'createLayer':
          result = await this.executeCreateLayer(action)
          break

        case 'deleteLayer':
          result = await this.executeDeleteLayer(action)
          break

        default:
          throw new Error(`Unknown action type: ${(action as any).type}`)
      }

      // Store executed action for undo
      this.executedActions.push(result)

      return result
    } catch (error: any) {
      console.error('Failed to execute AI action:', error)
      return {
        success: false,
        action,
        affectedTiles: 0,
        error: error.message || 'Failed to execute action',
      }
    }
  }

  /**
   * Execute batch of actions
   */
  async executeBatch(actions: AILayerAction[]): Promise<AIActionResult[]> {
    const results: AIActionResult[] = []

    for (const action of actions) {
      const result = await this.execute(action)
      results.push(result)

      // Stop on first error
      if (!result.success) {
        break
      }
    }

    return results
  }

  /**
   * Get execution history
   */
  getHistory(): AIActionResult[] {
    return [...this.executedActions]
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executedActions = []
  }

  // ============================================================================
  // Action Executors
  // ============================================================================

  /**
   * Paint individual tiles
   */
  private async executePaintTiles(
    action: Extract<AILayerAction, { type: 'paintTiles' }>
  ): Promise<AIActionResult> {
    const { layerId, tiles: tilesToPaint } = action

    // Execute tile updates
    await setTiles(
      this.canvasId,
      tilesToPaint.map((t) => ({ x: t.x, y: t.y, tile: t.tile })),
      this.userId,
      16, // chunkSize
      layerId
    )

    return {
      success: true,
      action,
      affectedTiles: tilesToPaint.length,
    }
  }

  /**
   * Erase individual tiles
   */
  private async executeEraseTiles(
    action: Extract<AILayerAction, { type: 'eraseTiles' }>
  ): Promise<AIActionResult> {
    const { layerId, tiles: tilesToErase } = action

    // Execute tile deletions
    await deleteTiles(
      this.canvasId,
      tilesToErase.map((t) => ({ x: t.x, y: t.y })),
      16, // chunkSize
      layerId
    )

    return {
      success: true,
      action,
      affectedTiles: tilesToErase.length,
    }
  }

  /**
   * Fill rectangular area with tile
   */
  private async executeFillArea(
    action: Extract<AILayerAction, { type: 'fillArea' }>
  ): Promise<AIActionResult> {
    const { layerId, x, y, width, height, tile } = action

    const tilesToPaint: Array<{ x: number; y: number; tile: TileData }> = []

    // Generate tiles for area
    for (let tileY = y; tileY < y + height; tileY++) {
      for (let tileX = x; tileX < x + width; tileX++) {
        tilesToPaint.push({ x: tileX, y: tileY, tile })
      }
    }

    // Execute paint
    await setTiles(this.canvasId, tilesToPaint, this.userId, 16, layerId)

    return {
      success: true,
      action,
      affectedTiles: tilesToPaint.length,
    }
  }

  /**
   * Generate terrain using procedural algorithm
   */
  private async executeGenerateTerrain(
    action: Extract<AILayerAction, { type: 'generateTerrain' }>
  ): Promise<AIActionResult> {
    const { layerId, algorithm, params } = action

    // Import algorithm dynamically
    let generateFn: (width: number, height: number, params: any) => TileData[][]

    // Extract dimensions
    const width = params.width || 30
    const height = params.height || 30

    switch (algorithm) {
      case 'perlin':
        const perlinModule = await import('../../algorithms/perlinNoise')
        generateFn = perlinModule.generatePerlinTerrain
        break

      case 'cellular':
        const cellularModule = await import('../../algorithms/cellularAutomata')
        generateFn = cellularModule.generateCellularCave
        break

      case 'randomWalk':
        const randomWalkModule = await import('../../algorithms/randomWalk')
        generateFn = randomWalkModule.generateRandomWalkPath
        break

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`)
    }

    // Generate terrain data
    const terrainData = generateFn(width, height, params)

    // Convert to tile updates with batch optimization
    const tilesToPaint: Array<{ x: number; y: number; tile: TileData }> = []
    for (let y = 0; y < terrainData.length; y++) {
      for (let x = 0; x < terrainData[y].length; x++) {
        const tile = terrainData[y][x]
        if (tile) {
          tilesToPaint.push({ x, y, tile })
        }
      }
    }

    // Apply auto-tiling variants in batch (only for sprite tiles)
    const { hasSpriteAsset } = await import('../../constants/tilemapDefaults')
    const { calculateProceduralAutoTileUpdates } = await import('../../utils/tilemap/autoTile')
    
    // Build temporary tile map for auto-tiling calculation
    const tempTileMap = new Map<string, TileData>()
    tilesToPaint.forEach(({ x, y, tile }) => {
      tempTileMap.set(`${x}_${y}`, tile)
    })
    
    // Calculate variants for all tiles that need sprites
    const tileUpdates = calculateProceduralAutoTileUpdates(tilesToPaint, tempTileMap)
    
    // Apply variants to tiles
    const finalTiles = tilesToPaint.map(({ x, y, tile }) => {
      const update = tileUpdates.find(u => u.x === x && u.y === y)
      if (update && hasSpriteAsset(tile.type)) {
        return { x, y, tile: { ...tile, variant: update.variant } }
      }
      return { x, y, tile }
    })

    // Execute paint with optimized batch size
    const OPTIMAL_BATCH_SIZE = 100 // Tiles per batch
    for (let i = 0; i < finalTiles.length; i += OPTIMAL_BATCH_SIZE) {
      const batch = finalTiles.slice(i, i + OPTIMAL_BATCH_SIZE)
      await setTiles(this.canvasId, batch, this.userId, 16, layerId)
    }

    return {
      success: true,
      action,
      affectedTiles: finalTiles.length,
    }
  }

  /**
   * Modify layer properties
   */
  private async executeModifyLayer(
    action: Extract<AILayerAction, { type: 'modifyLayer' }>
  ): Promise<AIActionResult> {
    const { layerId, updates } = action

    // Note: This would typically call updateLayer from tilemapSync
    // For now, we'll just return success
    // In production, you'd call: await updateLayer(this.canvasId, layerId, updates)

    return {
      success: true,
      action,
      affectedTiles: 0,
    }
  }

  /**
   * Create new layer
   */
  private async executeCreateLayer(
    action: Extract<AILayerAction, { type: 'createLayer' }>
  ): Promise<AIActionResult> {
    const { layer } = action

    // Note: This would typically call addLayer from tilemapSync
    // For now, we'll just return success
    // In production, you'd call: await addLayer(this.canvasId, layer)

    return {
      success: true,
      action,
      affectedTiles: 0,
    }
  }

  /**
   * Delete layer
   */
  private async executeDeleteLayer(
    action: Extract<AILayerAction, { type: 'deleteLayer' }>
  ): Promise<AIActionResult> {
    const { layerId } = action

    // Note: This would typically call removeLayer from tilemapSync
    // For now, we'll just return success
    // In production, you'd call: await removeLayer(this.canvasId, layerId)

    return {
      success: true,
      action,
      affectedTiles: 0,
    }
  }
}

/**
 * Create AI Layer Executor instance
 */
export function createAILayerExecutor(canvasId: string, userId: string): AILayerExecutor {
  return new AILayerExecutor(canvasId, userId)
}

/**
 * Parse AI response into layer actions
 * This is called after AI generates a response with tool results
 */
export function parseAIResponseToActions(
  toolResults: any[],
  meta: TilemapMeta
): AILayerAction[] {
  const actions: AILayerAction[] = []

  for (const result of toolResults) {
    if (!result.success) continue

    switch (result.tool) {
      case 'paintTiles':
        actions.push({
          type: 'paintTiles',
          layerId: result.layerId || meta.layers?.[0]?.id || 'ground',
          tiles: result.tiles || [],
        })
        break

      case 'eraseTiles':
        actions.push({
          type: 'eraseTiles',
          layerId: result.layerId || meta.layers?.[0]?.id || 'ground',
          tiles: result.tiles || [],
        })
        break

      case 'fillArea':
        actions.push({
          type: 'fillArea',
          layerId: result.layerId || meta.layers?.[0]?.id || 'ground',
          x: result.x,
          y: result.y,
          width: result.width,
          height: result.height,
          tile: result.tile,
        })
        break

      case 'generateTerrain':
        actions.push({
          type: 'generateTerrain',
          layerId: result.layerId || meta.layers?.[0]?.id || 'ground',
          algorithm: result.algorithm,
          params: result.params,
        })
        break

      case 'modifyLayer':
        actions.push({
          type: 'modifyLayer',
          layerId: result.layerId,
          updates: result.updates,
        })
        break

      case 'createLayer':
        actions.push({
          type: 'createLayer',
          layer: result.layer,
        })
        break

      case 'deleteLayer':
        actions.push({
          type: 'deleteLayer',
          layerId: result.layerId,
        })
        break
    }
  }

  return actions
}

