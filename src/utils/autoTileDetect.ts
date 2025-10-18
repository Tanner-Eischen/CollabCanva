// src/services/assets/utils/autoTileDetect.ts
/**
 * Compute a simple "edge signature" for a tile:
 * For each edge, sample N points and mark passable(1)/solid(0) based on brightness or alpha.
 * Then reduce to a boolean for each side: whether it's mostly-passable.
 */
export type EdgeSignature = { top: number; right: number; bottom: number; left: number }

export function edgeSignatureForTile(
  frame: Uint8ClampedArray,
  sheetW: number,
  x: number, y: number, w: number, h: number,
  samples = 6
): EdgeSignature {
  const passFrac = (xs: number[], ys: number[]) => {
    let pass = 0, tot = xs.length
    for (let i = 0; i < xs.length; i++) {
      const px = Math.min(xs[i], sheetW - 1)
      const py = Math.min(ys[i], y + h - 1)
      const idx = (py * sheetW + px) * 4
      const r = frame[idx], g = frame[idx + 1], b = frame[idx + 2], a = frame[idx + 3]
      const brightness = (r + g + b) / (3 * 255)
      const opaque = a > 10
      if (!opaque || brightness > 0.6) pass++
    }
    return pass / tot
  }

  const xsTop = Array.from({ length: samples }, (_, i) => x + Math.floor((i + 0.5) * w / samples))
  const ysTop = Array.from({ length: samples }, () => y)

  const xsBottom = xsTop
  const ysBottom = Array.from({ length: samples }, () => y + h - 1)

  const ysLeft = Array.from({ length: samples }, (_, i) => y + Math.floor((i + 0.5) * h / samples))
  const xsLeft = Array.from({ length: samples }, () => x)

  const ysRight = ysLeft
  const xsRight = Array.from({ length: samples }, () => x + w - 1)

  const threshold = 0.5
  return {
    top: passFrac(xsTop, ysTop) > threshold ? 1 : 0,
    right: passFrac(xsRight, ysRight) > threshold ? 1 : 0,
    bottom: passFrac(xsBottom, ysBottom) > threshold ? 1 : 0,
    left: passFrac(xsLeft, ysLeft) > threshold ? 1 : 0
  }
}

/**
 * Try to find a 4x4 "blob16" cluster within a set of tile indices.
 * We don't require contiguous indices—only that we can map 16 tiles to masks.
 * Returns the mapping {maskIndex -> tileIndex} if successful.
 */
export function detectBlob16Subgrid(
  tiles: { index: number; edge: EdgeSignature }[]
): { mapping: Record<number, number>; confidence: number } | null {
  // Blob16 masks (N,E,S,W bits) expected for 16-tile autotiles; order may vary by pack.
  const masks = [
    0b0000, 0b0001, 0b0010, 0b0011,
    0b0100, 0b0101, 0b0110, 0b0111,
    0b1000, 0b1001, 0b1010, 0b1011,
    0b1100, 0b1101, 0b1110, 0b1111
  ]

  const toMask = (e: EdgeSignature) => (e.top<<0) | (e.right<<1) | (e.bottom<<2) | (e.left<<3)
  const byMask: Record<number, number[]> = {}
  for (const t of tiles) {
    const m = toMask(t.edge)
    if (!byMask[m]) byMask[m] = []
    byMask[m].push(t.index)
  }

  const mapping: Record<number, number> = {}
  let have = 0
  for (const m of masks) {
    const candidates = byMask[m]
    if (candidates && candidates.length) {
      mapping[m] = candidates[0]
      have++
    }
  }

  if (have >= 12) {
    // Confidence scales with coverage of masks
    const confidence = have / 16
    return { mapping, confidence }
  }
  return null
}
