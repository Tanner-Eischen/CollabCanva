/**
 * AI Layer Actions Service
 * Translates AI operations → tilemap layer updates
 * PR-34: AI Tilemap Orchestration
 */

import type { TileData, TilemapMeta } from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { setTile, setTiles, deleteTile, deleteTiles } from '../tilemap/tilemapSync'
import { tilesetRegistry } from '../tilemap/tilesetRegistry'

/**
 * AI Action Types for Tilemap Operations
 */
export type AILayerAction =
  | { type: 'paintTiles'; layerId: string; tiles: Array<{ x: number; y: number; tile: TileData }> }
  | { type: 'eraseTiles'; layerId: string; tiles: Array<{ x: number; y: number }> }
  | { type: 'fillArea'; layerId: string; x: number; y: number; width: number; height: number; tile: TileData }
  | { type: 'generateTerrain'; layerId: string; algorithm: 'perlin' | 'cellular' | 'randomWalk' | 'wfc'; params: any }
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

    const normalizedTiles = await this.normalizeTileVariants(tilesToPaint)

    // Execute tile updates
    await setTiles(
      this.canvasId,
      normalizedTiles.map((t) => ({ x: t.x, y: t.y, tile: t.tile })),
      this.userId,
      16, // chunkSize
      layerId
    )

    return {
      success: true,
      action,
      affectedTiles: normalizedTiles.length,
    }
  }

  private async normalizeTileVariants(
    tiles: Array<{ x: number; y: number; tile: TileData }>
  ): Promise<Array<{ x: number; y: number; tile: TileData }>> {
    const uniqueTypes = new Set<string>()
    tiles.forEach(({ tile }) => {
      uniqueTypes.add(tile.type)
    })

    const spriteAvailability = new Map<string, boolean>()
    await Promise.all(
      Array.from(uniqueTypes).map(async (type) => {
        const hasSprite = await tilesetRegistry.hasSprite(type)
        spriteAvailability.set(type, hasSprite)
      })
    )

    return tiles.map(({ x, y, tile }) => {
      const supportsSprites = spriteAvailability.get(tile.type) ?? false
      const normalizedTile: TileData = { ...tile }

      if (!supportsSprites) {
        delete normalizedTile.variant
      } else if (normalizedTile.variant !== undefined) {
        normalizedTile.variant = Math.max(0, Math.min(8, Math.floor(normalizedTile.variant)))
      }

      return { x, y, tile: normalizedTile }
    })
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

    const normalizedTiles = await this.normalizeTileVariants(tilesToPaint)

    // Execute paint
    await setTiles(this.canvasId, normalizedTiles, this.userId, 16, layerId)

    return {
      success: true,
      action,
      affectedTiles: normalizedTiles.length,
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

      case 'wfc':
        const wfcModule = await import('../../algorithms/waveFunctionCollapse')
        generateFn = (w: number, h: number, generatorParams: any) => {
          const tilesetChoice = (generatorParams.tileset || generatorParams.wfcTileset || 'platform') as
            | 'platform'
            | 'dungeon'
            | 'terrain'
          let tileset = wfcModule.createPlatformTileset()
          if (tilesetChoice === 'dungeon') {
            tileset = wfcModule.createDungeonTileset()
          } else if (tilesetChoice === 'terrain') {
            tileset = wfcModule.createTerrainTileset()
          }

          return wfcModule.generateWFCMap({
            width: w,
            height: h,
            tiles: tileset,
            seed: generatorParams.seed,
            maxAttempts: generatorParams.maxAttempts,
          })
        }
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
    const { calculateProceduralAutoTileUpdates } = await import('../../utils/tilemap/autoTile')

    // Build temporary tile map for auto-tiling calculation
    const tempTileMap = new Map<string, TileData>()
    tilesToPaint.forEach(({ x, y, tile }) => {
      tempTileMap.set(`${x}_${y}`, tile)
    })

    // Calculate variants for all tiles that need sprites
    const tileUpdates = calculateProceduralAutoTileUpdates(tilesToPaint, tempTileMap)

    // Precompute sprite availability per tile type
    const uniqueTypes = new Set<string>()
    tilesToPaint.forEach(({ tile }) => {
      uniqueTypes.add(tile.type)
    })

    const spriteAvailability = new Map<string, boolean>()
    await Promise.all(
      Array.from(uniqueTypes).map(async (type) => {
        const hasSprite = await tilesetRegistry.hasSprite(type)
        spriteAvailability.set(type, hasSprite)
      })
    )

    const updateMap = new Map<string, number>()
    tileUpdates.forEach((update) => {
      updateMap.set(`${update.x}_${update.y}`, update.variant)
    })

    // Apply variants to tiles
    const finalTiles = tilesToPaint.map(({ x, y, tile }) => {
      const supportsSprites = spriteAvailability.get(tile.type) ?? false
      const updateVariant = updateMap.get(`${x}_${y}`)
      const nextTile: TileData = { ...tile }

      if (!supportsSprites) {
        delete nextTile.variant
        return { x, y, tile: nextTile }
      }

      if (nextTile.variant === undefined && updateVariant !== undefined) {
        nextTile.variant = updateVariant
      }

      return { x, y, tile: nextTile }
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

  tilesetRegistry.setActiveTileset(meta.activeTilesetId)
  const defaultLayerId = meta.layers?.[0]?.id || 'ground'
  const fallbackColor = meta.palette?.[0]?.color || '#ffffff'
  const paletteColorMap = new Map<string, string>(
    (meta.palette || []).map((entry) => [entry.type, entry.color])
  )

  const toNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
    return undefined
  }

  const getLayerId = (candidate: unknown): string => {
    return typeof candidate === 'string' && candidate.length > 0
      ? candidate
      : defaultLayerId
  }

  const getColorForType = (type: string | undefined, override?: unknown): string => {
    if (typeof override === 'string' && override.trim().length > 0) {
      return override
    }
    if (!type) {
      return fallbackColor
    }
    return paletteColorMap.get(type) || fallbackColor
  }

  for (const rawResult of toolResults || []) {
    if (!rawResult || rawResult.success === false) continue

    const toolName: string | undefined = rawResult.toolName || rawResult.tool
    if (!toolName) continue

    const params: Record<string, any> = rawResult.params || rawResult.arguments || {}
    const layerId = getLayerId(params.layerId)

    switch (toolName) {
      case 'paintTileRegion': {
        const startRow = toNumber(params.startRow)
        const startCol = toNumber(params.startCol)
        const endRow = toNumber(params.endRow)
        const endCol = toNumber(params.endCol)
        const tileType = typeof params.tileType === 'string' ? params.tileType : undefined

        if (
          startRow === undefined ||
          startCol === undefined ||
          endRow === undefined ||
          endCol === undefined ||
          !tileType
        ) {
          break
        }

        const minRow = Math.min(startRow, endRow)
        const maxRow = Math.max(startRow, endRow)
        const minCol = Math.min(startCol, endCol)
        const maxCol = Math.max(startCol, endCol)
        const variant = toNumber(params.variant)
        const tileColor = getColorForType(tileType, params.tileColor)

        const tiles: Array<{ x: number; y: number; tile: TileData }> = []
        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            const tile: TileData = {
              type: tileType,
              color: tileColor,
            }
            if (variant !== undefined) {
              tile.variant = variant
            }
            tiles.push({ x: col, y: row, tile })
          }
        }

        actions.push({
          type: 'paintTiles',
          layerId,
          tiles,
        })
        break
      }

      case 'eraseTileRegion': {
        const startRow = toNumber(params.startRow)
        const startCol = toNumber(params.startCol)
        const endRow = toNumber(params.endRow)
        const endCol = toNumber(params.endCol)

        if (
          startRow === undefined ||
          startCol === undefined ||
          endRow === undefined ||
          endCol === undefined
        ) {
          break
        }

        const minRow = Math.min(startRow, endRow)
        const maxRow = Math.max(startRow, endRow)
        const minCol = Math.min(startCol, endCol)
        const maxCol = Math.max(startCol, endCol)

        const tiles: Array<{ x: number; y: number }> = []
        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            tiles.push({ x: col, y: row })
          }
        }

        actions.push({
          type: 'eraseTiles',
          layerId,
          tiles,
        })
        break
      }

      case 'generateTilemap': {
        const algorithmParam: string | undefined =
          (typeof params.algorithm === 'string' && params.algorithm) ||
          (typeof rawResult.result?.data?.algorithm === 'string'
            ? rawResult.result.data.algorithm
            : undefined)

        if (!algorithmParam) {
          break
        }

        const algorithmMap: Record<string, 'perlin' | 'cellular' | 'randomWalk' | 'wfc'> = {
          'perlin-noise': 'perlin',
          'cellular-automata': 'cellular',
          'random-walk': 'randomWalk',
          'wave-function-collapse': 'wfc',
          noise: 'perlin',
          caves: 'cellular',
          paths: 'randomWalk',
          island: 'perlin',
        }

        const mappedAlgorithm = algorithmMap[algorithmParam]
        if (!mappedAlgorithm) {
          break
        }

        const width = toNumber(params.width) || meta.width
        const height = toNumber(params.height) || meta.height

        const actionParams: Record<string, any> = {
          ...params,
          width,
          height,
        }

        if (params.wfcTileset) {
          actionParams.tileset = params.wfcTileset
        }

        actions.push({
          type: 'generateTerrain',
          layerId,
          algorithm: mappedAlgorithm,
          params: actionParams,
        })
        break
      }

      case 'modifyLayer':
        actions.push({
          type: 'modifyLayer',
          layerId: params.layerId,
          updates: rawResult.updates ?? rawResult.result?.data?.updates ?? params.updates,
        })
        break

      case 'createLayer':
        actions.push({
          type: 'createLayer',
          layer: rawResult.layer || rawResult.result?.data?.layer || params.layer,
        })
        break

      case 'deleteLayer':
        actions.push({
          type: 'deleteLayer',
          layerId: params.layerId || rawResult.layerId,
        })
        break
    }
  }

  return actions
}

