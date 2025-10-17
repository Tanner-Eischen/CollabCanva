/**
 * TileStrokeCommand - Bulk tile set/delete command for paint strokes
 * Handles multiple tile changes in a single undo/redo operation
 */

import type { Command } from '../../types/command'
import type { TileData } from '../../types/tilemap'

/**
 * Tile change record
 */
interface TileChange {
  x: number
  y: number
  oldTile: TileData | undefined
  newTile: TileData | null // null = deletion
}

/**
 * Command for paint strokes (multiple tiles changed at once)
 * Similar to BulkCommand but for tiles
 * Undo: Restore all previous tile states
 * Redo: Re-apply all new tile states
 */
export class TileStrokeCommand implements Command {
  readonly type = 'bulk' as const
  
  private changes: TileChange[]
  private setTilesInState: (tiles: Array<{ x: number; y: number; tile: TileData }>) => void
  private deleteTilesInState: (tiles: Array<{ x: number; y: number }>) => void

  constructor(
    changes: TileChange[],
    setTilesInState: (tiles: Array<{ x: number; y: number; tile: TileData }>) => void,
    deleteTilesInState: (tiles: Array<{ x: number; y: number }>) => void
  ) {
    this.changes = changes
    this.setTilesInState = setTilesInState
    this.deleteTilesInState = deleteTilesInState
  }

  execute(): void {
    // Apply all new tiles
    const tilesToSet: Array<{ x: number; y: number; tile: TileData }> = []
    const tilesToDelete: Array<{ x: number; y: number }> = []
    
    this.changes.forEach((change) => {
      if (change.newTile === null) {
        tilesToDelete.push({ x: change.x, y: change.y })
      } else {
        tilesToSet.push({ x: change.x, y: change.y, tile: change.newTile })
      }
    })
    
    if (tilesToSet.length > 0) {
      this.setTilesInState(tilesToSet)
    }
    if (tilesToDelete.length > 0) {
      this.deleteTilesInState(tilesToDelete)
    }
  }

  undo(): void {
    // Restore all old tiles
    const tilesToSet: Array<{ x: number; y: number; tile: TileData }> = []
    const tilesToDelete: Array<{ x: number; y: number }> = []
    
    this.changes.forEach((change) => {
      if (change.oldTile) {
        tilesToSet.push({ x: change.x, y: change.y, tile: change.oldTile })
      } else {
        tilesToDelete.push({ x: change.x, y: change.y })
      }
    })
    
    if (tilesToSet.length > 0) {
      this.setTilesInState(tilesToSet)
    }
    if (tilesToDelete.length > 0) {
      this.deleteTilesInState(tilesToDelete)
    }
  }

  redo(): void {
    // Re-execute the command
    this.execute()
  }
}

