import { describe, it, expect } from 'vitest'
import {
  analyzeImageColors,
  suggestMaterialsFromColors,
  suggestThemesFromColors
} from '../colorAnalysis'
import { ImageData } from 'canvas'
import { __spriteDetectionInternals } from '../tilemap/spriteDetection'

describe('color analysis heuristics', () => {
  function makeImageData(
    width: number,
    height: number,
    colorFn: (x: number, y: number) => [number, number, number, number]
  ) {
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b, a] = colorFn(x, y)
        const idx = (y * width + x) * 4
        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        data[idx + 3] = a
      }
    }
    return new ImageData(data, width, height)
  }

  it('extracts dominant greens and infers forest-like metadata', () => {
    const image = makeImageData(4, 4, (_x, y) => {
      if (y < 3) {
        return [32, 200, 64, 255]
      }
      return [12, 64, 220, 255]
    })

    const analysis = analyzeImageColors(image, { sampleStep: 1, maxColors: 4 })

    expect(analysis.sampleCount).toBeGreaterThan(0)
    expect(analysis.dominant[0].hex).toEqual('#20c840')

    const materials = suggestMaterialsFromColors(analysis)
    expect(materials).toContain('grass')

    const themes = suggestThemesFromColors(analysis)
    expect(themes.map(t => t.theme)).toContain('forest')
  })

  it('classifies tall green sprites as trees', () => {
    const width = 16
    const height = 48
    const spriteImage = makeImageData(width, height, (x, y) => {
      if (y < 32) {
        return [40, 170, 60, 255]
      }
      const center = width / 2
      const trunkHalf = 2
      if (Math.abs(x - center) <= trunkHalf && y < 44) {
        return [94, 70, 38, 255]
      }
      if (Math.abs(x - center) <= trunkHalf && y < height) {
        return [94, 70, 38, 230]
      }
      return [0, 0, 0, 0]
    })

    const sprite = {
      x: 0,
      y: 0,
      width,
      height,
      area: width * height,
      confidence: 0.9
    }

    const { classifySprite } = __spriteDetectionInternals
    const classification = classifySprite(spriteImage, sprite)

    expect(classification.category).toBe('tree')
    expect(classification.tags).toContain('nature')
    expect(classification.dominantColors.length).toBeGreaterThan(0)
  })
})
