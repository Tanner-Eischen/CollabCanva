// src/services/assets/utils/materialClassifier.ts
import type { HSV } from "./tileColor"

export type Material =
  | "grass" | "water" | "stone" | "dirt" | "wood" | "sand" | "lava" | "metal" | "snow" | "tile"

export function classifyMaterialFromHSV(hsv: HSV): Material {
  const { h, s, v } = hsv
  // Normalize
  const H = (h + 360) % 360
  const S = s
  const V = v

  // Very low saturation, bright -> snow/stone/metal
  if (S < 0.10) {
    if (V > 0.80) return "snow"
    if (V > 0.55) return "stone"
    return "metal"
  }

  // Greens (grass)
  if (H >= 70 && H <= 160 && S > 0.25 && V > 0.25) return "grass"

  // Blues (water)
  if (H >= 180 && H <= 240 && S > 0.25) return "water"

  // Yellows (sand/wood) - use brightness to split
  if (H >= 40 && H <= 65) {
    return V > 0.6 ? "sand" : "wood"
  }

  // Oranges/Browns (dirt/wood)
  if (H >= 15 && H < 40) {
    return S > 0.4 ? (V > 0.5 ? "wood" : "dirt") : "dirt"
  }

  // Reds (lava?)
  if ((H >= 0 && H < 15) || (H > 330 && H <= 360)) {
    if (S > 0.5 && V > 0.5) return "lava"
  }

  // Greys (stone/metal)
  if (S < 0.2) return V > 0.5 ? "stone" : "metal"

  return "tile"
}
