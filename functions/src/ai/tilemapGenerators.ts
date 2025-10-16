/**
 * Tilemap Generation Algorithms
 * Procedural terrain generation for tilemaps
 * PR-30: Task 4.2
 */

import { createNoise2D } from 'simplex-noise';
import { TileData } from '../services/tilemapBatch';

/**
 * Generate terrain using Simplex Noise
 * Creates natural-looking terrain with smooth transitions
 */
export function generateNoiseTerrain(
  width: number,
  height: number,
  options: {
    seed?: number;
    scale?: number;
    waterThreshold?: number;
    stoneThreshold?: number;
  } = {}
): TileData[] {
  const tiles: TileData[] = [];
  const scale = options.scale || 0.1;
  const waterThreshold = options.waterThreshold || -0.2;
  const stoneThreshold = options.stoneThreshold || 0.5;
  
  // Create noise function with optional seed
  const noise2D = createNoise2D(() => options.seed || Math.random());

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Sample noise value
      const noiseValue = noise2D(col * scale, row * scale);
      
      // Map noise to tile types
      let tileType: string;
      if (noiseValue < waterThreshold) {
        tileType = 'water';
      } else if (noiseValue < 0) {
        tileType = 'dirt';
      } else if (noiseValue < stoneThreshold) {
        tileType = 'grass';
      } else {
        tileType = 'stone';
      }

      // Add occasional flowers on grass
      if (tileType === 'grass' && Math.random() < 0.1) {
        tileType = 'flower';
      }

      tiles.push({
        row,
        col,
        type: tileType,
        variant: Math.floor(Math.random() * 9),
      });
    }
  }

  return tiles;
}

/**
 * Generate caves using Cellular Automata
 * Creates organic cave-like structures
 */
export function generateCellularCaves(
  width: number,
  height: number,
  options: {
    fillProbability?: number;
    iterations?: number;
    birthLimit?: number;
    deathLimit?: number;
  } = {}
): TileData[] {
  const fillProbability = options.fillProbability || 0.45;
  const iterations = options.iterations || 4;
  const birthLimit = options.birthLimit || 4;
  const deathLimit = options.deathLimit || 3;

  // Initialize random grid
  let grid: boolean[][] = [];
  for (let row = 0; row < height; row++) {
    grid[row] = [];
    for (let col = 0; col < width; col++) {
      // Edges are always walls
      if (row === 0 || row === height - 1 || col === 0 || col === width - 1) {
        grid[row][col] = true; // wall
      } else {
        grid[row][col] = Math.random() < fillProbability;
      }
    }
  }

  // Apply cellular automata rules
  for (let iter = 0; iter < iterations; iter++) {
    const newGrid: boolean[][] = [];
    
    for (let row = 0; row < height; row++) {
      newGrid[row] = [];
      for (let col = 0; col < width; col++) {
        const neighbors = countNeighbors(grid, row, col, width, height);
        
        if (grid[row][col]) {
          // Currently a wall
          newGrid[row][col] = neighbors >= deathLimit;
        } else {
          // Currently a floor
          newGrid[row][col] = neighbors >= birthLimit;
        }
      }
    }
    
    grid = newGrid;
  }

  // Convert grid to tiles
  const tiles: TileData[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const tileType = grid[row][col] ? 'stone' : 'dirt';
      tiles.push({
        row,
        col,
        type: tileType,
        variant: Math.floor(Math.random() * 9),
      });
    }
  }

  return tiles;
}

/**
 * Count neighbors for cellular automata
 */
function countNeighbors(
  grid: boolean[][],
  row: number,
  col: number,
  width: number,
  height: number
): number {
  let count = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const newRow = row + dy;
      const newCol = col + dx;
      
      // Count out-of-bounds as walls
      if (newRow < 0 || newRow >= height || newCol < 0 || newCol >= width) {
        count++;
      } else if (grid[newRow][newCol]) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Generate paths using Random Walk
 * Creates winding paths through the tilemap
 */
export function generateRandomWalk(
  width: number,
  height: number,
  options: {
    steps?: number;
    pathWidth?: number;
    pathTile?: string;
    backgroundTile?: string;
    startX?: number;
    startY?: number;
  } = {}
): TileData[] {
  const steps = options.steps || Math.floor((width * height) * 0.3);
  const pathWidth = options.pathWidth || 1;
  const pathTile = options.pathTile || 'dirt';
  const backgroundTile = options.backgroundTile || 'grass';
  
  // Initialize grid with background
  const grid: string[][] = [];
  for (let row = 0; row < height; row++) {
    grid[row] = [];
    for (let col = 0; col < width; col++) {
      grid[row][col] = backgroundTile;
    }
  }

  // Random walk from center (or specified start)
  let currentRow = options.startY !== undefined ? options.startY : Math.floor(height / 2);
  let currentCol = options.startX !== undefined ? options.startX : Math.floor(width / 2);

  // Direction vectors: [up, right, down, left]
  const directions = [
    { dr: -1, dc: 0 },  // up
    { dr: 0, dc: 1 },   // right
    { dr: 1, dc: 0 },   // down
    { dr: 0, dc: -1 },  // left
  ];

  let currentDir = Math.floor(Math.random() * 4);
  
  for (let step = 0; step < steps; step++) {
    // Paint current position (and width)
    for (let w = -Math.floor(pathWidth / 2); w <= Math.floor(pathWidth / 2); w++) {
      const paintRow = currentRow + w;
      const paintCol = currentCol + w;
      
      if (paintRow >= 0 && paintRow < height && paintCol >= 0 && paintCol < width) {
        grid[paintRow][currentCol] = pathTile;
      }
      if (currentRow >= 0 && currentRow < height && paintCol >= 0 && paintCol < width) {
        grid[currentRow][paintCol] = pathTile;
      }
    }

    // Occasionally change direction (80% continue, 20% turn)
    if (Math.random() < 0.2) {
      currentDir = Math.floor(Math.random() * 4);
    }

    // Move in current direction
    const dir = directions[currentDir];
    currentRow += dir.dr;
    currentCol += dir.dc;

    // Wrap or bounce at boundaries
    if (currentRow < 0 || currentRow >= height) {
      currentRow = Math.max(0, Math.min(height - 1, currentRow));
      currentDir = (currentDir + 2) % 4; // reverse direction
    }
    if (currentCol < 0 || currentCol >= width) {
      currentCol = Math.max(0, Math.min(width - 1, currentCol));
      currentDir = (currentDir + 2) % 4; // reverse direction
    }
  }

  // Add some decorative flowers on grass
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] === 'grass' && Math.random() < 0.05) {
        grid[row][col] = 'flower';
      }
    }
  }

  // Convert grid to tiles
  const tiles: TileData[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      tiles.push({
        row,
        col,
        type: grid[row][col],
        variant: Math.floor(Math.random() * 9),
      });
    }
  }

  return tiles;
}

/**
 * Generate island terrain
 * Creates an island shape with water around edges
 */
export function generateIsland(
  width: number,
  height: number,
  options: {
    islandSize?: number;
  } = {}
): TileData[] {
  const tiles: TileData[] = [];
  const islandSize = options.islandSize || 0.7;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 * islandSize;

  const noise2D = createNoise2D();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Distance from center
      const dx = col - centerX;
      const dy = row - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalizedDistance = distance / maxRadius;

      // Combine distance with noise
      const noiseValue = noise2D(col * 0.1, row * 0.1);
      const combined = noiseValue - normalizedDistance * 2;

      let tileType: string;
      if (combined < -0.3) {
        tileType = 'water';
      } else if (combined < 0) {
        tileType = 'dirt'; // beach
      } else if (combined < 0.5) {
        tileType = 'grass';
      } else {
        tileType = 'stone'; // mountains
      }

      if (tileType === 'grass' && Math.random() < 0.08) {
        tileType = 'flower';
      }

      tiles.push({
        row,
        col,
        type: tileType,
        variant: Math.floor(Math.random() * 9),
      });
    }
  }

  return tiles;
}

