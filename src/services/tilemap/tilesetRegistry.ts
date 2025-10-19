import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'

import { firestore } from '../firebase'
import { BUILTIN_TILESET, getBuiltinTileset, listBuiltinTilesets } from '../../tilesets/builtin'
import type { TileVariantIndex, Tileset3x3, TilesetTerrain3x3 } from '../../types/tileset'

const DEFAULT_TILESET_ID = BUILTIN_TILESET.id

export class TilesetRegistry {
  private cache = new Map<string, Tileset3x3>()
  private loadingPromises = new Map<string, Promise<Tileset3x3 | undefined>>()
  private activeTilesetId: string

  constructor() {
    for (const tileset of listBuiltinTilesets()) {
      this.cache.set(tileset.id, tileset)
    }
    this.activeTilesetId = DEFAULT_TILESET_ID
  }

  setActiveTileset(tilesetId?: string | null): void {
    const resolvedId = tilesetId ?? DEFAULT_TILESET_ID
    this.activeTilesetId = resolvedId
    void this.getTileset(resolvedId)
  }

  async getActiveTileset(): Promise<Tileset3x3> {
    const tileset = await this.getTileset(this.activeTilesetId)
    if (!tileset) {
      this.activeTilesetId = DEFAULT_TILESET_ID
      return BUILTIN_TILESET
    }

    return tileset
  }

  async getTileset(id: string): Promise<Tileset3x3 | undefined> {
    const builtin = getBuiltinTileset(id)
    if (builtin) {
      this.cache.set(id, builtin)
      return builtin
    }

    if (this.cache.has(id)) {
      return this.cache.get(id)
    }

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)
    }

    const loadPromise = this.loadTilesetFromFirestore(id)
    this.loadingPromises.set(id, loadPromise)

    try {
      const loaded = await loadPromise
      if (loaded) {
        this.cache.set(id, loaded)
      }
      return loaded
    } finally {
      this.loadingPromises.delete(id)
    }
  }

  async listUserTilesets(userId: string): Promise<Tileset3x3[]> {
    try {
      const tilesetsRef = collection(firestore, 'tilesets3x3')
      const tilesetsQuery = query(tilesetsRef, where('owner', '==', userId))
      const snapshot = await getDocs(tilesetsQuery)

      const builtinTilesets = listBuiltinTilesets()
      const seenIds = new Set(builtinTilesets.map((tileset) => tileset.id))
      const userTilesets: Tileset3x3[] = []
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        if (!data) {
          return
        }

        const tileset = { id: docSnapshot.id, ...data } as Tileset3x3
        this.cache.set(tileset.id, tileset)
        if (!seenIds.has(tileset.id)) {
          seenIds.add(tileset.id)
          userTilesets.push(tileset)
        }
      })

      return [...builtinTilesets, ...userTilesets]
    } catch (error) {
      console.error('Failed to list user tilesets from Firestore:', error)
      return listBuiltinTilesets()
    }
  }

  async saveTileset(tileset: Tileset3x3): Promise<void> {
    console.log('TODO: implement saveTileset Firestore persistence', tileset)
  }

  async hasSprite(type: string): Promise<boolean> {
    const terrain = await this.findTerrain(type)
    return Boolean(terrain)
  }

  hasSpriteSync(type: string): boolean {
    const terrain = this.findTerrainSync(type)
    return Boolean(terrain)
  }

  async getTilePath(type: string, variant: number): Promise<string | undefined> {
    const terrain = await this.findTerrain(type)
    if (!terrain) {
      return undefined
    }

    const clampedVariant = this.clampVariantIndex(variant)
    return terrain.variants[clampedVariant]
  }

  getTilePathSync(type: string, variant: number): string | undefined {
    const terrain = this.findTerrainSync(type)
    if (!terrain) {
      return undefined
    }

    const clampedVariant = this.clampVariantIndex(variant)
    return terrain.variants[clampedVariant]
  }

  async getTerrainColor(type: string): Promise<string | undefined> {
    const tileset = await this.getActiveTileset()
    const paletteEntry = tileset.palette?.find((entry) => entry.type === type)
    return paletteEntry?.color
  }

  async getAllTypes(): Promise<string[]> {
    const tileset = await this.getActiveTileset()
    return tileset.terrains.map((terrain) => terrain.id)
  }

  clear(): void {
    this.cache.clear()
    this.loadingPromises.clear()
    for (const tileset of listBuiltinTilesets()) {
      this.cache.set(tileset.id, tileset)
    }
    this.activeTilesetId = DEFAULT_TILESET_ID
  }

  private async findTerrain(type: string): Promise<TilesetTerrain3x3 | undefined> {
    const tileset = await this.getActiveTileset()
    return tileset.terrains.find((terrain) => terrain.id === type)
  }

  private findTerrainSync(type: string): TilesetTerrain3x3 | undefined {
    const activeTileset = this.cache.get(this.activeTilesetId)
    const tileset = activeTileset ?? this.cache.get(DEFAULT_TILESET_ID) ?? BUILTIN_TILESET
    return tileset.terrains.find((terrain) => terrain.id === type)
  }

  private clampVariantIndex(variant: number): TileVariantIndex {
    const normalized = Math.max(0, Math.min(8, Math.floor(variant)))
    return (normalized + 1) as TileVariantIndex
  }

  private async loadTilesetFromFirestore(id: string): Promise<Tileset3x3 | undefined> {
    try {
      const docRef = doc(firestore, 'tilesets3x3', id)
      const snapshot = await getDoc(docRef)
      if (!snapshot.exists()) {
        return undefined
      }

      const data = snapshot.data()
      if (!data) {
        return undefined
      }

      return { id: snapshot.id, ...data } as Tileset3x3
    } catch (error) {
      console.error(`Failed to load tileset ${id} from Firestore:`, error)
      return undefined
    }
  }
}

export const tilesetRegistry = new TilesetRegistry()
