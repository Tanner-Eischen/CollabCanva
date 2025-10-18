import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { TilemapMeta } from '../../../types/tilemap'

vi.mock('../tilemap/tilemapSync', () => ({
  setTile: vi.fn(),
  setTiles: vi.fn(),
  deleteTile: vi.fn(),
  deleteTiles: vi.fn()
}))

vi.mock('../../firebase', () => ({
  db: {},
  storage: {},
  auth: {},
  firestore: {}
}))

let parseAIResponseToActions: typeof import('../aiLayerActions').parseAIResponseToActions

beforeAll(async () => {
  ;({ parseAIResponseToActions } = await import('../aiLayerActions'))
})

describe('parseAIResponseToActions', () => {
  const meta: TilemapMeta = {
    palette: [
      { type: 'grass', color: '#00ff00' },
      { type: 'water', color: '#0000ff' }
    ],
    layers: [
      { id: 'ground', name: 'Ground', type: 'tile', isVisible: true, opacity: 1, tileSize: 16 }
    ],
    width: 10,
    height: 10
  }

  it('converts paintTileRegion tool results into paint actions with variants', () => {
    const toolResults = [
      {
        toolName: 'paintTileRegion',
        params: {
          startRow: 0,
          startCol: 0,
          endRow: 1,
          endCol: 1,
          tileType: 'grass',
          variant: 2
        },
        success: true
      }
    ]

    const actions = parseAIResponseToActions(toolResults, meta)
    expect(actions).toHaveLength(1)
    expect(actions[0].type).toBe('paintTiles')
    expect(actions[0].tiles).toHaveLength(4)
    expect(actions[0].tiles[0].tile.variant).toBe(2)
    expect(actions[0].tiles[0].tile.color).toBe('#00ff00')
  })

  it('ignores invalid tool results', () => {
    const toolResults = [
      {
        toolName: 'paintTileRegion',
        params: { startRow: 'a', startCol: 0, endRow: 1, endCol: 1, tileType: 'grass' },
        success: true
      },
      {
        toolName: 'eraseTileRegion',
        params: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
        success: false
      }
    ]

    const actions = parseAIResponseToActions(toolResults, meta)
    expect(actions).toHaveLength(0)
  })

  it('falls back to default layer and color when not provided', () => {
    const toolResults = [
      {
        toolName: 'paintTileRegion',
        params: {
          startRow: 0,
          startCol: 0,
          endRow: 0,
          endCol: 0,
          tileType: 'unknown'
        },
        success: true
      }
    ]

    const actions = parseAIResponseToActions(toolResults, meta)
    expect(actions[0].layerId).toBe('ground')
    expect(actions[0].tiles[0].tile.color).toBe('#00ff00')
  })
})
