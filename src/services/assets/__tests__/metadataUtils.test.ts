import { describe, expect, it } from 'vitest'
import type { SpriteSelection, SpriteSheetMetadata, TilesetMetadata } from '../../../types/asset'
import {
  applySemanticNamingToSprites,
  buildTileSemanticGroups,
  cloneSpriteSheetMetadata,
  cloneTilesetMetadata
} from '../metadataUtils'

describe('metadataUtils', () => {
  it('buildTileSemanticGroups groups tiles by semantic prefix', () => {
    const namedTiles = {
      'grass.center': 0,
      'grass.edge_north': 1,
      'water.center': 2
    }

    const groups = buildTileSemanticGroups(namedTiles, {
      materials: ['Grass', 'Water'],
      themes: ['Forest'],
      autoTileSystem: 'blob16'
    } as Pick<TilesetMetadata, 'materials' | 'themes' | 'autoTileSystem'>)

    expect(Object.keys(groups)).toEqual(['grass', 'water'])
    expect(groups.grass.variants).toContain('center')
    expect(groups.grass.variants).toContain('edge_north')
    expect(groups.water.tileCount).toBe(1)
    expect(groups.grass.materials).toEqual(['Grass'])
  })

  it('applySemanticNamingToSprites renames sprites using semantic mapping', () => {
    const selections: SpriteSelection[] = [
      { id: '1', name: 'sprite_00', x: 0, y: 0, width: 16, height: 16 },
      { id: '2', name: 'sprite_01', x: 16, y: 0, width: 16, height: 16 }
    ]

    const result = applySemanticNamingToSprites(selections, { 'Grass.Center': 0 }, 'tileset')

    expect(result.renamedCount).toBe(1)
    expect(selections[0].name).toBe('tileset_grass_center')
    expect(selections[1].name).toBe('sprite_01')
    expect(result.sampleNames).toHaveLength(2)
  })

  it('clone helpers create deep copies of metadata', () => {
    const tilesetMeta: TilesetMetadata = {
      tileWidth: 16,
      tileHeight: 16,
      columns: 2,
      rows: 2,
      spacing: 0,
      margin: 0,
      tileCount: 4,
      namedTiles: { 'grass.center': 0 },
      tileGroups: {
        grass: {
          label: 'Grass',
          description: 'variants',
          autoTileSystem: 'blob16',
          materials: ['grass'],
          themes: ['forest'],
          tiles: { center: 0 },
          variants: ['center'],
          tileCount: 1
        }
      }
    }

    const clonedTileset = cloneTilesetMetadata(tilesetMeta)
    expect(clonedTileset).not.toBe(tilesetMeta)
    clonedTileset.tileGroups!.grass.variants.push('edge')
    expect(tilesetMeta.tileGroups!.grass.variants).toEqual(['center'])

    const spriteMeta: SpriteSheetMetadata = {
      frameWidth: 16,
      frameHeight: 16,
      spriteSelections: [
        { id: 'a', name: 'sprite_00', x: 0, y: 0, width: 16, height: 16 }
      ]
    }

    const clonedSprite = cloneSpriteSheetMetadata(spriteMeta)
    expect(clonedSprite).not.toBe(spriteMeta)
    clonedSprite.spriteSelections![0].name = 'edited'
    expect(spriteMeta.spriteSelections![0].name).toBe('sprite_00')
  })
})
