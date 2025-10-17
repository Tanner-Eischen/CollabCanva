/**
 * TileFillCommand - Flood fill command for tilemap
 * Extends TileStrokeCommand since it's also a bulk operation
 */

import { TileStrokeCommand } from './TileStrokeCommand'
import type { TileData } from '../../types/tilemap'

/**
 * Command for flood fill operations
 * Uses TileStrokeCommand internally since fill is just a bulk tile change
 * 
 * This is a specialized version that can show progress indicators
 * and provide metadata about the fill operation
 */
export class TileFillCommand extends TileStrokeCommand {
  private fillStartX: number
  private fillStartY: number
  private fillTileCount: number

  constructor(
    fillStartX: number,
    fillStartY: number,
    changes: Array<{ x: number; y: number; oldTile: TileData | undefined; newTile: TileData | null }>,
    setTilesInState: (tiles: Array<{ x: number; y: number; tile: TileData }>) => void,
    deleteTilesInState: (tiles: Array<{ x: number; y: number }>) => void
  ) {
    super(changes, setTilesInState, deleteTilesInState)
    this.fillStartX = fillStartX
    this.fillStartY = fillStartY
    this.fillTileCount = changes.length
  }

  /**
   * Get metadata about the fill operation
   */
  getFillMetadata() {
    return {
      startX: this.fillStartX,
      startY: this.fillStartY,
      tileCount: this.fillTileCount,
    }
  }

  // All other methods inherited from TileStrokeCommand
}

