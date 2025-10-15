/**
 * TileCommand - Single tile and bulk tile commands with undo/redo
 * Handles setting or deleting tiles with proper state management
 * Supports auto-tile variant preservation
 */

import type { Command } from '../types/command'
import type { TileData } from '../types/tilemap'

/**
 * Command for setting or deleting a single tile
 * Undo: Restore previous tile state (including variant)
 * Redo: Re-apply new tile state (including variant)
 */
export class TileSetCommand implements Command {
  readonly type = 'create' as const // Reuse 'create' type for tiles
  
  private x: number
  private y: number
  private oldTile: TileData | undefined
  private newTile: TileData
  private setTileInState: (x: number, y: number, tile: TileData) => void
  private deleteTileInState: (x: number, y: number) => void

  constructor(
    x: number,
    y: number,
    oldTile: TileData | undefined,
    newTile: TileData,
    setTileInState: (x: number, y: number, tile: TileData) => void,
    deleteTileInState: (x: number, y: number) => void
  ) {
    this.x = x
    this.y = y
    // Store complete tile data including variant
    this.oldTile = oldTile ? { ...oldTile } : undefined
    this.newTile = { ...newTile }
    this.setTileInState = setTileInState
    this.deleteTileInState = deleteTileInState
  }

  execute(): void {
    // Set tile in state (syncs to Firebase automatically via hook)
    this.setTileInState(this.x, this.y, this.newTile)
  }

  undo(): void {
    if (this.oldTile) {
      // Restore previous tile (with variant)
      this.setTileInState(this.x, this.y, this.oldTile)
    } else {
      // Delete tile if there was no previous tile
      this.deleteTileInState(this.x, this.y)
    }
  }

  redo(): void {
    // Re-apply the new tile (with variant)
    this.setTileInState(this.x, this.y, this.newTile)
  }
}

/**
 * Command for bulk tile operations (paint strokes, fill, etc.)
 * Efficiently handles multiple tile changes as a single undoable action
 */
export class BulkTileCommand implements Command {
  readonly type = 'create' as const
  
  private tiles: Array<{
    x: number
    y: number
    oldTile: TileData | undefined
    newTile: TileData | null // null indicates deletion
  }>
  private setTileInState: (x: number, y: number, tile: TileData) => void
  private deleteTileInState: (x: number, y: number) => void

  constructor(
    tiles: Array<{
      x: number
      y: number
      oldTile: TileData | undefined
      newTile: TileData | null
    }>,
    setTileInState: (x: number, y: number, tile: TileData) => void,
    deleteTileInState: (x: number, y: number) => void
  ) {
    // Deep copy tile data to preserve variants
    this.tiles = tiles.map((t) => ({
      x: t.x,
      y: t.y,
      oldTile: t.oldTile ? { ...t.oldTile } : undefined,
      newTile: t.newTile ? { ...t.newTile } : null,
    }))
    this.setTileInState = setTileInState
    this.deleteTileInState = deleteTileInState
  }

  execute(): void {
    // Apply all tile changes
    this.tiles.forEach(({ x, y, newTile }) => {
      if (newTile) {
        this.setTileInState(x, y, newTile)
      } else {
        this.deleteTileInState(x, y)
      }
    })
  }

  undo(): void {
    // Restore all previous tiles
    this.tiles.forEach(({ x, y, oldTile }) => {
      if (oldTile) {
        this.setTileInState(x, y, oldTile)
      } else {
        this.deleteTileInState(x, y)
      }
    })
  }

  redo(): void {
    // Re-apply all tile changes
    this.execute()
  }
}

