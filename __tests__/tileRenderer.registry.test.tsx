import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TileData } from '../src/types/tilemap'

vi.mock('../src/services/firebase', () => ({
  firestore: {},
  db: {},
}))

vi.mock('react-konva', () => {
  const React = require('react')
  return {
    Layer: ({ children, ...props }: { children: React.ReactNode }) => {
      const {
        listening: _listening,
        perfectDrawEnabled: _perfectDrawEnabled,
        hitGraphEnabled: _hitGraphEnabled,
        imageSmoothingEnabled: _imageSmoothingEnabled,
        ...rest
      } = props as Record<string, unknown>
      return (
        <div data-component="Layer" {...rest}>
          {children}
        </div>
      )
    },
    Rect: ({ children, ...props }: { children?: React.ReactNode }) => {
      const {
        listening: _listening,
        perfectDrawEnabled: _perfectDrawEnabled,
        hitGraphEnabled: _hitGraphEnabled,
        imageSmoothingEnabled: _imageSmoothingEnabled,
        ...rest
      } = props as Record<string, unknown>
      return (
        <div data-component="Rect" {...rest}>
          {children}
        </div>
      )
    },
  }
})

vi.mock('../src/components/canvas/SpriteTile', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: ({ tilePath, x, y, tileSize, opacity }: Record<string, unknown>) => (
      <div
        data-testid="sprite-tile"
        data-path={tilePath as string}
        data-x={x as number}
        data-y={y as number}
        data-size={tileSize as number}
        data-opacity={opacity as number}
      />
    ),
  }
})

vi.mock('../src/components/canvas/AnimatedTile', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <div data-testid="animated-tile" {...props} />,
}))

import TileRenderer from '../src/components/tilemap/TileRenderer'

describe('TileRenderer integration with tileset registry', () => {
  it('renders sprite tiles for grass/dirt boundary using registry data', async () => {
    const tiles = new Map<string, TileData>([
      ['0_0', { type: 'grass', color: '#4ade80', variant: 4 }],
      ['1_0', { type: 'dirt', color: '#b45309', variant: 4 }],
    ])

    const { asFragment } = render(
      <TileRenderer
        tiles={tiles}
        tileSize={32}
        viewportX={0}
        viewportY={0}
        viewportWidth={64}
        viewportHeight={32}
      />
    )

    const spriteTiles = await screen.findAllByTestId('sprite-tile')
    expect(spriteTiles).toHaveLength(2)

    expect(spriteTiles.map((tile) => tile.getAttribute('data-path'))).toMatchInlineSnapshot(`
      [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR42mNwOl5MU8QwasGoBaMWjFowasGoBaMWjFowasGoBaMWDBULAGQg8Ey6liD6AAAAAElFTkSuQmCC",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR42mNY5MVBU8QwasGoBaMWjFowasGoBaMWjFowasGoBaMWDBULAM8A0C5B34lnAAAAAElFTkSuQmCC",
      ]
    `)

    expect(asFragment()).toMatchSnapshot()
  })
})
