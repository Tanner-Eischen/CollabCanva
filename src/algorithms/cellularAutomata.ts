/**
 * Cellular Automata Generator
 * Implements cave and dungeon generation using cellular automata rules
 */

/**
 * Parameters for cellular automata generation
 */
export interface CellularAutomataParams {
  initialDensity: number; // Starting fill ratio (0-1), higher = more walls
  birthLimit: number; // Neighbors needed for cell birth (typically 4)
  deathLimit: number; // Neighbors needed to stay alive (typically 4)
  iterations: number; // Simulation steps (4-10 typical)
  seed?: number; // Seed for reproducible generation
}

/**
 * Default parameters for cave generation
 */
export const DEFAULT_CAVE_PARAMS: CellularAutomataParams = {
  initialDensity: 0.45,
  birthLimit: 4,
  deathLimit: 3,
  iterations: 5
};

/**
 * Default parameters for dungeon generation
 */
export const DEFAULT_DUNGEON_PARAMS: CellularAutomataParams = {
  initialDensity: 0.48,
  birthLimit: 4,
  deathLimit: 4,
  iterations: 4
};

/**
 * Seeded random number generator
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
 * Initialize random grid based on density
 * Returns 2D array where true = wall, false = floor
 */
function initializeGrid(
  width: number,
  height: number,
  density: number,
  random: SeededRandom
): boolean[][] {
  const grid: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      // Always wall on edges
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(true);
      } else {
        row.push(random.next() < density);
      }
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Count alive neighbors (Moore neighborhood - 8 neighbors)
 */
function countAliveNeighbors(
  grid: boolean[][],
  x: number,
  y: number
): number {
  let count = 0;
  const height = grid.length;
  const width = grid[0]?.length || 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue; // Skip self

      const nx = x + dx;
      const ny = y + dy;

      // Treat out of bounds as walls
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        count++;
      } else if (grid[ny][nx]) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Apply cellular automata rules for one step
 */
function step(
  grid: boolean[][],
  birthLimit: number,
  deathLimit: number
): boolean[][] {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const newGrid: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const neighbors = countAliveNeighbors(grid, x, y);
      const isAlive = grid[y][x];

      // Keep edges as walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(true);
      }
      // Apply birth/death rules
      else if (isAlive) {
        row.push(neighbors >= deathLimit);
      } else {
        row.push(neighbors >= birthLimit);
      }
    }
    newGrid.push(row);
  }

  return newGrid;
}

/**
 * Generate cave or dungeon using cellular automata
 * Returns 2D array where true = wall, false = floor
 */
export function generateCave(
  width: number,
  height: number,
  params: CellularAutomataParams = DEFAULT_CAVE_PARAMS
): boolean[][] {
  const random = new SeededRandom(params.seed || Date.now());

  // Initialize random grid
  let grid = initializeGrid(width, height, params.initialDensity, random);

  // Apply cellular automata rules
  for (let i = 0; i < params.iterations; i++) {
    grid = step(grid, params.birthLimit, params.deathLimit);
  }

  return grid;
}

/**
 * Remove single-tile islands (smoothing pass)
 * Fills in isolated floor tiles, removes isolated walls
 */
export function removeIslands(
  grid: boolean[][],
  minRegionSize: number = 5
): boolean[][] {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const newGrid = grid.map(row => [...row]);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const neighbors = countAliveNeighbors(grid, x, y);

      // If floor surrounded by walls, fill it
      if (!grid[y][x] && neighbors >= 7) {
        newGrid[y][x] = true;
      }

      // If wall surrounded by floors, remove it
      if (grid[y][x] && neighbors <= 1) {
        newGrid[y][x] = false;
      }
    }
  }

  return newGrid;
}

/**
 * Flood fill to find connected regions
 */
function floodFill(
  grid: boolean[][],
  startX: number,
  startY: number,
  visited: Set<string>
): number {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const queue: [number, number][] = [[startX, startY]];
  let count = 0;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (grid[y][x]) continue; // Wall

    visited.add(key);
    count++;

    // Add neighbors
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return count;
}

/**
 * Find all regions and connect them with corridors
 * Ensures all floor areas are connected
 */
export function connectRegions(grid: boolean[][]): boolean[][] {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const visited = new Set<string>();
  const regions: { x: number; y: number; size: number }[] = [];

  // Find all regions
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (!visited.has(key) && !grid[y][x]) {
        const size = floodFill(grid, x, y, visited);
        if (size > 10) {
          // Only keep significant regions
          regions.push({ x, y, size });
        }
      }
    }
  }

  // If only one region, we're done
  if (regions.length <= 1) {
    return grid;
  }

  // Sort by size (largest first)
  regions.sort((a, b) => b.size - a.size);

  // Connect all regions to the largest one
  const newGrid = grid.map(row => [...row]);
  const mainRegion = regions[0];

  for (let i = 1; i < regions.length; i++) {
    const region = regions[i];

    // Draw corridor from region to main region
    let x = region.x;
    let y = region.y;

    // Move horizontally
    while (x !== mainRegion.x) {
      newGrid[y][x] = false;
      x += x < mainRegion.x ? 1 : -1;
    }

    // Move vertically
    while (y !== mainRegion.y) {
      newGrid[y][x] = false;
      y += y < mainRegion.y ? 1 : -1;
    }

    // Widen corridor slightly
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          if (Math.random() > 0.5) {
            // Random widening
            newGrid[ny][nx] = false;
          }
        }
      }
    }
  }

  return newGrid;
}

/**
 * Convert boolean grid to tilemap
 * Maps walls to 'wall' tile type, floors to 'floor' tile type
 */
export function gridToTilemap(
  grid: boolean[][],
  wallTile: string = 'stone',
  floorTile: string = 'dirt'
): string[][] {
  return grid.map(row =>
    row.map(isWall => (isWall ? wallTile : floorTile))
  );
}

/**
 * Generate complete cave tilemap with all processing
 */
export function generateCaveTilemap(
  width: number,
  height: number,
  params: CellularAutomataParams = DEFAULT_CAVE_PARAMS,
  options: {
    removeIslands?: boolean;
    connectRegions?: boolean;
    wallTile?: string;
    floorTile?: string;
  } = {}
): string[][] {
  const {
    removeIslands: shouldRemoveIslands = true,
    connectRegions: shouldConnectRegions = true,
    wallTile = 'stone',
    floorTile = 'dirt'
  } = options;

  // Generate base cave
  let grid = generateCave(width, height, params);

  // Post-processing
  if (shouldRemoveIslands) {
    grid = removeIslands(grid);
  }

  if (shouldConnectRegions) {
    grid = connectRegions(grid);
  }

  // Convert to tilemap
  return gridToTilemap(grid, wallTile, floorTile);
}

/**
 * Get random floor position (for placing objects)
 */
export function getRandomFloorPosition(
  grid: boolean[][],
  random?: SeededRandom
): { x: number; y: number } | null {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const rng = random || new SeededRandom(Date.now());

  // Try up to 100 times to find floor tile
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = Math.floor(rng.next() * width);
    const y = Math.floor(rng.next() * height);

    if (!grid[y][x]) {
      return { x, y };
    }
  }

  // Fallback: find first floor tile
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x]) {
        return { x, y };
      }
    }
  }

  return null;
}

/**
 * Count floor tiles (useful for density metrics)
 */
export function countFloorTiles(grid: boolean[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (!cell) count++;
    }
  }
  return count;
}

/**
 * Get density of cave (ratio of floor to total)
 */
export function getCaveDensity(grid: boolean[][]): number {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const total = width * height;
  const floor = countFloorTiles(grid);
  return floor / total;
}

/**
 * Wrapper: Generate cave as TileData array (for tile generator service)
 */
export function generateCellularCave(
  width: number,
  height: number,
  params: Partial<CellularAutomataParams> = {}
): import('../types/tilemap').TileData[][] {
  const fullParams = { ...DEFAULT_CAVE_PARAMS, ...params }
  const grid = generateCave(width, height, fullParams)
  const tilemap = gridToTilemap(grid, 'stone', 'dirt')
  
  // Convert to TileData
  return tilemap.map(row =>
    row.map(type => ({
      type,
      color: type === 'stone' ? '#6b7280' : '#92400e'
    }))
  )
}

/**
 * Wrapper: Generate dungeon as TileData array (for tile generator service)
 */
export function generateCellularDungeon(
  width: number,
  height: number,
  params: Partial<CellularAutomataParams> = {}
): import('../types/tilemap').TileData[][] {
  const fullParams = { ...DEFAULT_DUNGEON_PARAMS, ...params }
  const grid = generateCave(width, height, fullParams)
  const tilemap = gridToTilemap(grid, 'stone', 'grass')
  
  // Convert to TileData
  return tilemap.map(row =>
    row.map(type => ({
      type,
      color: type === 'stone' ? '#6b7280' : '#4ade80'
    }))
  )
}


