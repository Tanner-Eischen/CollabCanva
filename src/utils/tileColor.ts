// src/services/assets/utils/tileColor.ts
export type HSV = { h: number; s: number; v: number }

export function rgbToHsv(r: number, g: number, b: number): HSV {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break
      case gn: h = ((bn - rn) / d + 2); break
      case bn: h = ((rn - gn) / d + 4); break
    }
    h *= 60
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}

/**
 * Downsample a tile region by sampling a sparse grid (e.g., 6x6) and
 * averaging. The frameBuffer is a Uint8ClampedArray RGBA image of the whole sheet.
 */
export function sampleTileHSV(
  frameBuffer: Uint8ClampedArray,
  sheetW: number,
  sheetH: number,
  x: number, y: number, w: number, h: number,
  samples = 6
) {
  let sumH = 0, sumS = 0, sumV = 0, n = 0
  const hueBins = new Array(12).fill(0)

  for (let iy = 0; iy < samples; iy++) {
    for (let ix = 0; ix < samples; ix++) {
      const px = Math.min(x + Math.floor((ix + 0.5) * w / samples), x + w - 1)
      const py = Math.min(y + Math.floor((iy + 0.5) * h / samples), y + h - 1)
      const idx = (py * sheetW + px) * 4
      const r = frameBuffer[idx], g = frameBuffer[idx + 1], b = frameBuffer[idx + 2]
      const { h: H, s: S, v: V } = rgbToHsv(r, g, b)
      sumH += H; sumS += S; sumV += V; n++
      hueBins[Math.floor((H % 360) / 30)]++
    }
  }

  const avg: HSV = { h: sumH / n, s: sumS / n, v: sumV / n }
  const dominantHueBin = hueBins.indexOf(Math.max(...hueBins))
  return { avg, hueBins, samples: n }
}
