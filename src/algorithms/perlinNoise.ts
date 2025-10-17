/**
 * Perlin Noise Generator
 * Implements classic Perlin noise for natural-looking terrain generation
 */

import type { TileData } from '../types/tilemap'

/**
 * Parameters for Perlin noise generation
 */
export interface PerlinNoiseParams {
  scale: number; // Controls feature size (0.01-1.0)
  octaves: number; // Number of noise layers (1-8)
  persistence: number; // Amplitude multiplier per octave (0-1)
  lacunarity: number; // Frequency multiplier per octave (>1)
  seed?: number; // Seed for reproducible generation
}

/**
 * Height map thresholds for tile type mapping
 */
export interface HeightMapThresholds {
  [tileType: string]: { min: number; max: number };
}

/**
 * Default Perlin noise parameters
 */
export const DEFAULT_PERLIN_PARAMS: PerlinNoiseParams = {
  scale: 0.1,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0,
  seed: Math.random() * 1000000
};

/**
 * Permutation table for Perlin noise (Ken Perlin's original)
 */
const PERMUTATION = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
  36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
  234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
  88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
  134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
  230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
  1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
  116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
  124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
  47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
  154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
  108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
  242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
  239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
  50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
  141, 128, 195, 78, 66, 215, 61, 156, 180
];

/**
 * Seeded random number generator (for reproducible noise)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

/**
 * Perlin Noise Generator class
 */
export class PerlinNoiseGenerator {
  private p: number[];
  private random: SeededRandom;

  constructor(seed?: number) {
    this.random = new SeededRandom(seed || Date.now());
    this.p = new Array(512);

    // Create seeded permutation table
    const perm = [...PERMUTATION];
    
    // Fisher-Yates shuffle with seeded random
    if (seed !== undefined) {
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(this.random.next() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
    }

    // Duplicate permutation table
    for (let i = 0; i < 256; i++) {
      this.p[i] = this.p[i + 256] = perm[i];
    }
  }

  /**
   * Fade function for smooth interpolation (6t^5 - 15t^4 + 10t^3)
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  /**
   * Gradient function
   */
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * 2D Perlin noise function
   * Returns value between -1 and 1
   */
  private noise2D(x: number, y: number): number {
    // Find unit grid cell containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // Get relative xy coordinates of point within cell
    x -= Math.floor(x);
    y -= Math.floor(y);

    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);

    // Hash coordinates of 4 cube corners
    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    // Blend results from 4 corners
    return this.lerp(
      v,
      this.lerp(u, this.grad(aa, x, y), this.grad(ba, x - 1, y)),
      this.lerp(u, this.grad(ab, x, y - 1), this.grad(bb, x - 1, y - 1))
    );
  }

  /**
   * Generate 2D Perlin noise with octaves
   * Returns value between -1 and 1
   */
  public noise(x: number, y: number, params: PerlinNoiseParams): number {
    let value = 0;
    let amplitude = 1;
    let frequency = params.scale;
    let maxValue = 0;

    // Add octaves
    for (let i = 0; i < params.octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;

      amplitude *= params.persistence;
      frequency *= params.lacunarity;
    }

    // Normalize to [-1, 1]
    return value / maxValue;
  }
}

/**
 * Generate a height map using Perlin noise
 * Returns 2D array of normalized values (0-1)
 */
export function generateHeightMap(
  width: number,
  height: number,
  params: PerlinNoiseParams = DEFAULT_PERLIN_PARAMS
): number[][] {
  const generator = new PerlinNoiseGenerator(params.seed);
  const heightMap: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // Get noise value (-1 to 1) and normalize to (0 to 1)
      const noiseValue = generator.noise(x, y, params);
      const normalized = (noiseValue + 1) / 2;
      row.push(normalized);
    }
    heightMap.push(row);
  }

  return heightMap;
}

/**
 * Convert height map to tilemap using thresholds
 * Maps height values to tile types
 */
export function heightMapToTilemap(
  heightMap: number[][],
  thresholds: HeightMapThresholds
): string[][] {
  const height = heightMap.length;
  const width = heightMap[0]?.length || 0;
  const tilemap: string[][] = [];

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const value = heightMap[y][x];

      // Find matching tile type
      let tileType = 'grass'; // default
      for (const [type, range] of Object.entries(thresholds)) {
        if (value >= range.min && value < range.max) {
          tileType = type;
          break;
        }
      }

      row.push(tileType);
    }
    tilemap.push(row);
  }

  return tilemap;
}

/**
 * Default thresholds for common terrain types
 */
export const DEFAULT_TERRAIN_THRESHOLDS: HeightMapThresholds = {
  water: { min: 0.0, max: 0.3 },
  sand: { min: 0.3, max: 0.4 },
  grass: { min: 0.4, max: 0.6 },
  dirt: { min: 0.6, max: 0.7 },
  stone: { min: 0.7, max: 0.85 },
  mountain: { min: 0.85, max: 1.0 }
};

/**
 * Generate a complete terrain tilemap in one call
 */
export function generateTerrainTilemap(
  width: number,
  height: number,
  params: PerlinNoiseParams = DEFAULT_PERLIN_PARAMS,
  thresholds: HeightMapThresholds = DEFAULT_TERRAIN_THRESHOLDS
): string[][] {
  const heightMap = generateHeightMap(width, height, params);
  return heightMapToTilemap(heightMap, thresholds);
}

/**
 * Apply smoothing to height map (reduces noise, makes terrain gentler)
 */
export function smoothHeightMap(
  heightMap: number[][],
  radius: number = 1
): number[][] {
  const height = heightMap.length;
  const width = heightMap[0]?.length || 0;
  const smoothed: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;

      // Average with neighbors
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += heightMap[ny][nx];
            count++;
          }
        }
      }

      row.push(sum / count);
    }
    smoothed.push(row);
  }

  return smoothed;
}

/**
 * Improved height thresholds with better visual balance
 * No empty/blank tiles - all height values map to valid tile types
 */
export const IMPROVED_TERRAIN_THRESHOLDS: HeightMapThresholds = {
  water: { min: 0.0, max: 0.35 },    // Deep water areas
  grass: { min: 0.35, max: 0.60 },   // Grasslands (most common)
  dirt: { min: 0.60, max: 0.75 },    // Dirt/earth
  stone: { min: 0.75, max: 1.01 },   // Stone/mountains (extended to 1.01 to catch edge cases)
};

/**
 * Generate Perlin terrain as TileData 2D array
 * This is the main function used by the tile generator service
 */
export function generatePerlinTerrain(
  width: number,
  height: number,
  params: Partial<PerlinNoiseParams> = {}
): TileData[][] {
  // Merge with defaults
  const fullParams: PerlinNoiseParams = {
    ...DEFAULT_PERLIN_PARAMS,
    ...params,
  };

  // Generate height map
  const heightMap = generateHeightMap(width, height, fullParams);
  
  // Convert to tile type map
  const tileTypeMap = heightMapToTilemap(heightMap, IMPROVED_TERRAIN_THRESHOLDS);
  
  // Convert to TileData array
  const tileData: TileData[][] = [];
  
  // Color mapping for tile types
  const colorMap: Record<string, string> = {
    water: '#3b82f6',  // Blue
    grass: '#4ade80',  // Green
    dirt: '#92400e',   // Brown
    stone: '#6b7280',  // Gray
  };
  
  for (let y = 0; y < height; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < width; x++) {
      const tileType = tileTypeMap[y][x];
      
      // Create tile data with proper type and color
      row.push({
        type: tileType,
        color: colorMap[tileType] || '#4ade80', // Default to grass if unknown
      });
    }
    tileData.push(row);
  }
  
  return tileData;
}


