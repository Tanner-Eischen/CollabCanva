import { BUILTIN_TILESET } from '../../tilesets/builtin'
import type { TileVariantIndex, Tileset3x3, TilesetTerrain3x3 } from '../../types/tileset'

const DEFAULT_TILESET_ID = BUILTIN_TILESET.id

export class TilesetRegistry {
  private cache = new Map<string, Tileset3x3>()
  private activeTilesetId: string

  constructor() {
    this.cache.set(BUILTIN_TILESET.id, BUILTIN_TILESET)
    this.activeTilesetId = DEFAULT_TILESET_ID
  }

  setActiveTileset(tilesetId?: string | null): void {
    const resolvedId = tilesetId && this.cache.has(tilesetId) ? tilesetId : DEFAULT_TILESET_ID
    this.activeTilesetId = resolvedId
  }

  getActiveTileset(): Tileset3x3 {
    if (!this.cache.has(this.activeTilesetId)) {
      this.activeTilesetId = DEFAULT_TILESET_ID
    }

    return this.cache.get(this.activeTilesetId) ?? BUILTIN_TILESET
  }

  getTileset(id: string): Tileset3x3 | undefined {
    if (this.cache.has(id)) {
      return this.cache.get(id)
    }

    if (id === BUILTIN_TILESET.id) {
      this.cache.set(id, BUILTIN_TILESET)
      return BUILTIN_TILESET
    }

    return undefined
  }

  hasSprite(type: string): boolean {
    return Boolean(this.findTerrain(type))
  }

  getTilePath(type: string, variant: number): string | undefined {
    const terrain = this.findTerrain(type)
    if (!terrain) {
      return undefined
    }

    const clampedVariant = this.clampVariantIndex(variant)
    return terrain.variants[clampedVariant]
  }

  getTerrainColor(type: string): string | undefined {
    const tileset = this.getActiveTileset()
    const paletteEntry = tileset.palette?.find((entry) => entry.type === type)
    return paletteEntry?.color
  }

  getAllTypes(): string[] {
    return this.getActiveTileset().terrains.map((terrain) => terrain.id)
  }

  clear(): void {
    this.cache.clear()
    this.cache.set(BUILTIN_TILESET.id, BUILTIN_TILESET)
    this.activeTilesetId = DEFAULT_TILESET_ID
  }

  private findTerrain(type: string): TilesetTerrain3x3 | undefined {
    return this.getActiveTileset().terrains.find((terrain) => terrain.id === type)
  }

  private clampVariantIndex(variant: number): TileVariantIndex {
    const normalized = Math.max(0, Math.min(8, Math.floor(variant)))
    return (normalized + 1) as TileVariantIndex
  }
}

export const tilesetRegistry = new TilesetRegistry()
