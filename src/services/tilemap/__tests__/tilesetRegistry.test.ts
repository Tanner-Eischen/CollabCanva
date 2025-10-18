import { beforeEach, describe, expect, it } from 'vitest'

import { BUILTIN_TERRAIN_ASSETS } from '../../../tilesets/builtinAssets'
import { tilesetRegistry } from '../tilesetRegistry'

describe('TilesetRegistry', () => {
  beforeEach(() => {
    tilesetRegistry.clear()
  })

  it('reports sprite availability for known terrain types', () => {
    expect(tilesetRegistry.hasSprite('water')).toBe(true)
    expect(tilesetRegistry.hasSprite('unknown')).toBe(false)
  })

  it('clamps variant indices when returning tile paths', () => {
    tilesetRegistry.setActiveTileset('builtin-default')

    expect(tilesetRegistry.getTilePath('grass', -5)).toBe(BUILTIN_TERRAIN_ASSETS.grass[1])
    expect(tilesetRegistry.getTilePath('grass', 4)).toBe(BUILTIN_TERRAIN_ASSETS.grass[5])
    expect(tilesetRegistry.getTilePath('grass', 99)).toBe(BUILTIN_TERRAIN_ASSETS.grass[9])
  })

  it('returns all available terrain types for the active tileset', () => {
    const types = tilesetRegistry.getAllTypes()
    expect(types).toEqual(['grass', 'dirt', 'water', 'stone'])
  })
})
