import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tileset3x3 } from '../src/types/tileset'
import { BUILTIN_TERRAIN_ASSETS } from '../src/tilesets/builtinAssets'

const firestoreStoreRef = vi.hoisted(() => ({
  current: new Map<string, Record<string, unknown>>()
}))

vi.mock('../src/services/firebase', () => ({
  firestore: {},
}))

vi.mock('firebase/firestore', () => {
  const store = firestoreStoreRef.current

  const doc = vi.fn((_firestore: unknown, collectionName: string, id: string) => ({
    path: `${collectionName}/${id}`,
  }))

  const setDoc = vi.fn(async (ref: { path: string }, data: Record<string, unknown>) => {
    store.set(ref.path, { ...data })
  })

  const getDoc = vi.fn(async (ref: { path: string }) => {
    const data = store.get(ref.path)
    return {
      exists: () => Boolean(data),
      data: () => data,
      id: ref.path.split('/')[1] ?? '',
    }
  })

  const collection = vi.fn((_firestore: unknown, name: string) => ({ name }))

  const where = vi.fn((field: string, _op: string, value: unknown) => ({ field, value }))

  const query = vi.fn((collectionRef: { name: string }, ...filters: Array<{ field: string; value: unknown }>) => ({
    collectionRef,
    filters,
  }))

  const getDocs = vi.fn(async (queryRef: { collectionRef: { name: string }; filters: Array<{ field: string; value: unknown }> }) => {
    const entries: Array<{ id: string; data: () => Record<string, unknown> }> = []
    const ownerFilter = queryRef.filters.find((filter) => filter.field === 'owner')

    for (const [path, value] of store.entries()) {
      if (!path.startsWith(`${queryRef.collectionRef.name}/`)) {
        continue
      }
      if (ownerFilter && (value as { owner?: unknown }).owner !== ownerFilter.value) {
        continue
      }
      const id = path.split('/')[1] ?? ''
      entries.push({
        id,
        data: () => value,
      })
    }

    return {
      forEach: (callback: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
        entries.forEach((entry) => callback(entry))
      },
    }
  })

  return {
    doc,
    setDoc,
    getDoc,
    collection,
    where,
    query,
    getDocs,
  }
})

// Import after mocks are declared
import { TilesetRegistry } from '../src/services/tilemap/tilesetRegistry'

describe('TilesetRegistry', () => {
  let registry: TilesetRegistry

  beforeEach(() => {
    firestoreStoreRef.current.clear()
    vi.clearAllMocks()
    registry = new TilesetRegistry()
  })

  it('hasSprite returns true for builtin terrain types', async () => {
    await expect(registry.hasSprite('grass')).resolves.toBe(true)
    await expect(registry.hasSprite('dirt')).resolves.toBe(true)
  })

  it('getTilePath clamps variant indexes to valid bounds', async () => {
    const tilePath = await registry.getTilePath('grass', 42)
    expect(tilePath).toBe(BUILTIN_TERRAIN_ASSETS.grass[9])
  })

  it('falls back to builtin tileset when the active id is missing', async () => {
    registry.setActiveTileset('non-existent-tileset')
    const active = await registry.getActiveTileset()
    expect(active.id).toBe('builtin-default')
  })

  it('saves tilesets to Firestore and loads them back via getTileset', async () => {
    const customTileset: Tileset3x3 = {
      id: 'custom-forest',
      name: 'Custom Forest',
      tileSize: 32,
      terrains: [
        {
          id: 'grass',
          name: 'Grass',
          variants: BUILTIN_TERRAIN_ASSETS.grass,
        },
      ],
      palette: [
        { type: 'grass', color: '#4ade80', name: 'Grass' },
      ],
      description: 'User provided tileset',
    }

    const userId = 'user-123'
    await registry.saveTileset(customTileset, userId)

    registry.clear()

    const loaded = await registry.getTileset(customTileset.id)
    expect(loaded).toMatchObject({
      id: customTileset.id,
      name: customTileset.name,
      tileSize: customTileset.tileSize,
    })
    expect((loaded as Record<string, unknown>)?.owner).toBe(userId)
    expect((loaded as Record<string, unknown>)?.updatedAt).toEqual(expect.any(Number))
  })
})
