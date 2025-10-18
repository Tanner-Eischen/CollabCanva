import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../firebase', () => ({
  firestore: {},
}))

import { BUILTIN_TERRAIN_ASSETS } from '../../../tilesets/builtinAssets'
import { tilesetRegistry } from '../tilesetRegistry'

describe('TilesetRegistry', () => {
  beforeEach(() => {
    tilesetRegistry.clear()
  })

  it('reports sprite availability for known terrain types', async () => {
    await expect(tilesetRegistry.hasSprite('water')).resolves.toBe(true)
    await expect(tilesetRegistry.hasSprite('unknown')).resolves.toBe(false)
  })

  it('clamps variant indices when returning tile paths', async () => {
    tilesetRegistry.setActiveTileset('builtin-default')

    await expect(tilesetRegistry.getTilePath('grass', -5)).resolves.toBe(BUILTIN_TERRAIN_ASSETS.grass[1])
    await expect(tilesetRegistry.getTilePath('grass', 4)).resolves.toBe(BUILTIN_TERRAIN_ASSETS.grass[5])
    await expect(tilesetRegistry.getTilePath('grass', 99)).resolves.toBe(BUILTIN_TERRAIN_ASSETS.grass[9])
  })

  it('returns all available terrain types for the active tileset', async () => {
    await expect(tilesetRegistry.getAllTypes()).resolves.toEqual(['grass', 'dirt', 'water', 'stone'])
  })
})
