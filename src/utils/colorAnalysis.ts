export interface RGB {
  r: number
  g: number
  b: number
}

export interface DominantColor extends RGB {
  hex: string
  count: number
  ratio: number
  hue: number
  saturation: number
  lightness: number
}

export interface ImageColorAnalysis {
  dominant: DominantColor[]
  hueHistogram: number[]
  saturationHistogram: number[]
  lightnessHistogram: number[]
  sampleCount: number
  averageHue: number
  averageSaturation: number
  averageLightness: number
}

const DEFAULT_SAMPLE_STEP = 4
const DEFAULT_MAX_COLORS = 8
const ALPHA_THRESHOLD = 24

export function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  if (delta === 0) return 0

  let hue: number
  if (max === rn) {
    hue = ((gn - bn) / delta) % 6
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2
  } else {
    hue = (rn - gn) / delta + 4
  }

  hue *= 60
  if (hue < 0) hue += 360

  return hue
}

export function rgbToSaturation(r: number, g: number, b: number): number {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  if (max === 0) return 0

  return (max - min) / max
}

export function rgbToLightness(r: number, g: number, b: number): number {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)

  return (max + min) / 2
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

interface ColorAccumulator {
  count: number
  r: number
  g: number
  b: number
  hue: number
  saturation: number
  lightness: number
}

function quantizeKey(r: number, g: number, b: number): string {
  const bucketSize = 16 // 0-255 mapped into 16 buckets (~4 bits)
  const qr = Math.floor(r / bucketSize)
  const qg = Math.floor(g / bucketSize)
  const qb = Math.floor(b / bucketSize)
  return `${qr}-${qg}-${qb}`
}

export function analyzeImageColors(
  imageData: ImageData,
  options: { sampleStep?: number; maxColors?: number; alphaThreshold?: number } = {}
): ImageColorAnalysis {
  const { sampleStep = DEFAULT_SAMPLE_STEP, maxColors = DEFAULT_MAX_COLORS, alphaThreshold = ALPHA_THRESHOLD } = options

  const hueHistogram = new Array(36).fill(0)
  const saturationHistogram = new Array(12).fill(0)
  const lightnessHistogram = new Array(12).fill(0)
  const colorBuckets = new Map<string, ColorAccumulator>()

  let sampleCount = 0
  let hueSum = 0
  let satSum = 0
  let lightSum = 0

  for (let i = 0; i < imageData.data.length; i += sampleStep * 4) {
    const r = imageData.data[i]
    const g = imageData.data[i + 1]
    const b = imageData.data[i + 2]
    const a = imageData.data[i + 3]

    if (a < alphaThreshold) continue

    const hue = rgbToHue(r, g, b)
    const saturation = rgbToSaturation(r, g, b)
    const lightness = rgbToLightness(r, g, b)

    const hueIndex = Math.min(35, Math.floor(hue / 10))
    const satIndex = Math.min(11, Math.floor(saturation * 12))
    const lightIndex = Math.min(11, Math.floor(lightness * 12))

    hueHistogram[hueIndex]++
    saturationHistogram[satIndex]++
    lightnessHistogram[lightIndex]++

    hueSum += hue
    satSum += saturation
    lightSum += lightness
    sampleCount++

    const key = quantizeKey(r, g, b)
    const bucket = colorBuckets.get(key)
    if (bucket) {
      bucket.count++
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.hue += hue
      bucket.saturation += saturation
      bucket.lightness += lightness
    } else {
      colorBuckets.set(key, {
        count: 1,
        r,
        g,
        b,
        hue,
        saturation,
        lightness
      })
    }
  }

  const dominant = Array.from(colorBuckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map(bucket => {
      const avgR = bucket.r / bucket.count
      const avgG = bucket.g / bucket.count
      const avgB = bucket.b / bucket.count
      return {
        r: avgR,
        g: avgG,
        b: avgB,
        hex: rgbToHex(avgR, avgG, avgB),
        count: bucket.count,
        ratio: bucket.count / Math.max(sampleCount, 1),
        hue: bucket.hue / bucket.count,
        saturation: bucket.saturation / bucket.count,
        lightness: bucket.lightness / bucket.count
      }
    })

  return {
    dominant,
    hueHistogram,
    saturationHistogram,
    lightnessHistogram,
    sampleCount,
    averageHue: sampleCount ? hueSum / sampleCount : 0,
    averageSaturation: sampleCount ? satSum / sampleCount : 0,
    averageLightness: sampleCount ? lightSum / sampleCount : 0
  }
}

export function suggestMaterialsFromColors(analysis: ImageColorAnalysis): string[] {
  const materials = new Set<string>()
  const totalHue = analysis.hueHistogram.reduce((sum, value) => sum + value, 0) || 1

  const bucketRatio = (start: number, end: number) => {
    let total = 0
    for (let i = start; i < end; i++) total += analysis.hueHistogram[i]
    return total / totalHue
  }

  const greenRatio = bucketRatio(9, 15) // 90-150°
  const yellowRatio = bucketRatio(4, 9) // 40-90°
  const blueRatio = bucketRatio(18, 25) // 180-250°
  const redRatio = bucketRatio(0, 4) + bucketRatio(35, 36) // around 0°
  const purpleRatio = bucketRatio(25, 32) // 250-320°

  const avgSat = analysis.averageSaturation
  const avgLight = analysis.averageLightness

  if (greenRatio > 0.22) {
    materials.add('grass')
    if (yellowRatio > 0.08) materials.add('foliage')
  }

  if (yellowRatio > 0.18 && avgSat < 0.75) {
    materials.add('sand')
    materials.add('dirt')
  }

  if (blueRatio > 0.18) {
    materials.add(avgLight > 0.65 ? 'ice' : 'water')
  }

  if (avgSat < 0.18 && avgLight > 0.25 && avgLight < 0.75) {
    materials.add('stone')
  }

  if (avgLight < 0.35 && redRatio > 0.15) {
    materials.add('lava')
  }

  if (purpleRatio > 0.12 && avgLight < 0.45) {
    materials.add('crystal')
  }

  if (greenRatio > 0.18 && yellowRatio > 0.12) {
    materials.add('wood')
  }

  if (avgLight > 0.8 && avgSat < 0.2) {
    materials.add('snow')
  }

  return Array.from(materials)
}

export function suggestThemesFromColors(analysis: ImageColorAnalysis): Array<{ theme: string; confidence: number }> {
  const themes: Array<{ theme: string; confidence: number }> = []
  const totalHue = analysis.hueHistogram.reduce((sum, value) => sum + value, 0) || 1

  const ratio = (start: number, end: number) => {
    let total = 0
    for (let i = start; i < end; i++) total += analysis.hueHistogram[i]
    return total / totalHue
  }

  const greenRatio = ratio(9, 15)
  const yellowRatio = ratio(4, 9)
  const blueRatio = ratio(18, 25)
  const redRatio = ratio(0, 4) + ratio(35, 36)
  const purpleRatio = ratio(25, 32)

  const avgSat = analysis.averageSaturation
  const avgLight = analysis.averageLightness

  if (greenRatio > 0.28) {
    themes.push({ theme: 'forest', confidence: Math.min(0.95, greenRatio + avgSat * 0.2) })
  }

  if (yellowRatio > 0.25) {
    themes.push({ theme: 'desert', confidence: Math.min(0.9, yellowRatio + (1 - avgSat) * 0.2) })
  }

  if (blueRatio > 0.25) {
    themes.push({ theme: avgLight > 0.7 ? 'snow' : 'water', confidence: Math.min(0.9, blueRatio + (1 - avgLight) * 0.1) })
  }

  if (avgSat < 0.22 && avgLight > 0.25 && avgLight < 0.6) {
    themes.push({ theme: 'dungeon', confidence: 0.65 })
  }

  if (redRatio > 0.2 && avgLight < 0.6) {
    themes.push({ theme: 'lava', confidence: Math.min(0.85, redRatio + (1 - avgLight)) })
  }

  if (purpleRatio > 0.18) {
    themes.push({ theme: 'mystic', confidence: Math.min(0.8, purpleRatio + avgSat * 0.2) })
  }

  if (avgLight > 0.82 && avgSat < 0.2) {
    themes.push({ theme: 'snow', confidence: 0.75 })
  }

  return themes.sort((a, b) => b.confidence - a.confidence)
}

export function clampPalette(palette: DominantColor[], max: number = 8): string[] {
  return palette.slice(0, max).map(color => color.hex)
}
