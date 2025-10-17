/**
 * Wave Function Collapse (WFC) Generator
 * Implements constraint-based generation for tilemaps
 * Simplified version optimized for game development
 */

/**
 * Tile with adjacency constraints
 */
export interface WFCTile {
  id: string; // Tile identifier
  weight: number; // Probability weight (higher = more common)
  adjacencyRules: {
    north: string[]; // Valid tile IDs that can be placed to the north
    south: string[];
    east: string[];
    west: string[];
  };
}

/**
 * Parameters for WFC generation
 */
export interface WFCParams {
  width: number;
  height: number;
  tiles: WFCTile[];
  seed?: number;
  maxAttempts?: number; // Max attempts before restart (default: 100)
}

/**
 * Cell state in WFC grid
 */
interface WFCCell {
  collapsed: boolean;
  possibleTiles: Set<string>;
  entropy: number;
}

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

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  weightedChoice(tiles: WFCTile[], possibleIds: Set<string>): WFCTile {
    const possible = tiles.filter(t => possibleIds.has(t.id));
    const totalWeight = possible.reduce((sum, t) => sum + t.weight, 0);
    let random = this.next() * totalWeight;

    for (const tile of possible) {
      random -= tile.weight;
      if (random <= 0) return tile;
    }

    return possible[possible.length - 1];
  }
}

/**
 * Initialize WFC grid with all possibilities
 */
function initializeGrid(
  width: number,
  height: number,
  tileIds: string[]
): WFCCell[][] {
  const grid: WFCCell[][] = [];

  for (let y = 0; y < height; y++) {
    const row: WFCCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        collapsed: false,
        possibleTiles: new Set(tileIds),
        entropy: tileIds.length
      });
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Calculate entropy (number of possible tiles) for a cell
 */
function calculateEntropy(cell: WFCCell, random: SeededRandom): number {
  if (cell.collapsed) return 0;
  // Add small random noise to break ties
  return cell.possibleTiles.size + random.next() * 0.1;
}

/**
 * Find cell with lowest entropy (most constrained)
 */
function findLowestEntropyCell(
  grid: WFCCell[][],
  random: SeededRandom
): { x: number; y: number } | null {
  const height = grid.length;
  const width = grid[0]?.length || 0;

  let minEntropy = Infinity;
  let bestCells: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (!cell.collapsed && cell.possibleTiles.size > 0) {
        const entropy = calculateEntropy(cell, random);
        if (entropy < minEntropy) {
          minEntropy = entropy;
          bestCells = [{ x, y }];
        } else if (Math.abs(entropy - minEntropy) < 0.01) {
          bestCells.push({ x, y });
        }
      }
    }
  }

  if (bestCells.length === 0) return null;
  return random.choice(bestCells);
}

/**
 * Get neighbors of a cell
 */
function getNeighbors(
  grid: WFCCell[][],
  x: number,
  y: number
): Array<{
  x: number;
  y: number;
  direction: 'north' | 'south' | 'east' | 'west';
}> {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const neighbors: Array<{
    x: number;
    y: number;
    direction: 'north' | 'south' | 'east' | 'west';
  }> = [];

  if (y > 0) neighbors.push({ x, y: y - 1, direction: 'north' });
  if (y < height - 1) neighbors.push({ x, y: y + 1, direction: 'south' });
  if (x < width - 1) neighbors.push({ x: x + 1, y, direction: 'east' });
  if (x > 0) neighbors.push({ x: x - 1, y, direction: 'west' });

  return neighbors;
}

/**
 * Opposite direction
 */
function oppositeDirection(
  direction: 'north' | 'south' | 'east' | 'west'
): 'north' | 'south' | 'east' | 'west' {
  switch (direction) {
    case 'north':
      return 'south';
    case 'south':
      return 'north';
    case 'east':
      return 'west';
    case 'west':
      return 'east';
  }
}

/**
 * Propagate constraints from a collapsed cell
 */
function propagate(
  grid: WFCCell[][],
  startX: number,
  startY: number,
  tiles: WFCTile[],
  tileMap: Map<string, WFCTile>
): boolean {
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid[y][x];
    const neighbors = getNeighbors(grid, x, y);

    for (const neighbor of neighbors) {
      const nCell = grid[neighbor.y][neighbor.x];
      if (nCell.collapsed) continue;

      // Find valid tiles for neighbor based on current cell's possibilities
      const validNeighborTiles = new Set<string>();

      for (const tileId of cell.possibleTiles) {
        const tile = tileMap.get(tileId);
        if (!tile) continue;

        const oppositeDir = oppositeDirection(neighbor.direction);
        for (const validId of tile.adjacencyRules[neighbor.direction]) {
          validNeighborTiles.add(validId);
        }
      }

      // Constrain neighbor
      const oldSize = nCell.possibleTiles.size;
      nCell.possibleTiles = new Set(
        [...nCell.possibleTiles].filter(id => validNeighborTiles.has(id))
      );

      // Contradiction?
      if (nCell.possibleTiles.size === 0) {
        return false; // Contradiction detected
      }

      // If changed, add to queue
      if (nCell.possibleTiles.size < oldSize) {
        nCell.entropy = nCell.possibleTiles.size;
        queue.push({ x: neighbor.x, y: neighbor.y });
      }
    }
  }

  return true; // Success
}

/**
 * Collapse a cell to a specific tile
 */
function collapseCell(
  grid: WFCCell[][],
  x: number,
  y: number,
  tile: WFCTile
): void {
  const cell = grid[y][x];
  cell.collapsed = true;
  cell.possibleTiles = new Set([tile.id]);
  cell.entropy = 0;
}

/**
 * Check if grid is fully collapsed
 */
function isFullyCollapsed(grid: WFCCell[][]): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.collapsed) return false;
    }
  }
  return true;
}

/**
 * Generate tilemap using Wave Function Collapse
 */
export function collapse(params: WFCParams): string[][] | null {
  const { width, height, tiles, seed, maxAttempts = 100 } = params;
  const random = new SeededRandom(seed || Date.now());
  const tileMap = new Map(tiles.map(t => [t.id, t]));
  const tileIds = tiles.map(t => t.id);

  // Initialize grid
  let grid = initializeGrid(width, height, tileIds);

  let attempts = 0;

  while (!isFullyCollapsed(grid) && attempts < maxAttempts) {
    attempts++;

    // Find cell with lowest entropy
    const cell = findLowestEntropyCell(grid, random);
    if (!cell) break; // No more cells to collapse

    const { x, y } = cell;
    const currentCell = grid[y][x];

    // Choose tile based on weights
    const chosenTile = random.weightedChoice(tiles, currentCell.possibleTiles);

    // Collapse cell
    collapseCell(grid, x, y, chosenTile);

    // Propagate constraints
    const success = propagate(grid, x, y, tiles, tileMap);

    // If contradiction, restart
    if (!success) {
      console.warn(`WFC: Contradiction detected, restarting (attempt ${attempts}/${maxAttempts})`);
      grid = initializeGrid(width, height, tileIds);
      attempts++;

      if (attempts >= maxAttempts) {
        console.error('WFC: Max attempts reached, generation failed');
        return null;
      }
    }
  }

  // Convert to tilemap
  const tilemap: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      if (cell.possibleTiles.size > 0) {
        row.push([...cell.possibleTiles][0]);
      } else {
        // Fallback to first tile if no possibilities
        row.push(tileIds[0]);
      }
    }
    tilemap.push(row);
  }

  return tilemap;
}

/**
 * Create standard platform tileset with constraints
 */
export function createPlatformTileset(): WFCTile[] {
  return [
    {
      id: 'grass',
      weight: 3,
      adjacencyRules: {
        north: ['grass', 'air', 'dirt'],
        south: ['grass', 'dirt'],
        east: ['grass', 'air', 'dirt'],
        west: ['grass', 'air', 'dirt']
      }
    },
    {
      id: 'dirt',
      weight: 5,
      adjacencyRules: {
        north: ['grass', 'dirt'],
        south: ['dirt', 'stone'],
        east: ['dirt', 'grass', 'stone'],
        west: ['dirt', 'grass', 'stone']
      }
    },
    {
      id: 'stone',
      weight: 2,
      adjacencyRules: {
        north: ['dirt', 'stone'],
        south: ['stone'],
        east: ['stone', 'dirt'],
        west: ['stone', 'dirt']
      }
    },
    {
      id: 'air',
      weight: 4,
      adjacencyRules: {
        north: ['air', 'grass'],
        south: ['air', 'grass'],
        east: ['air', 'grass'],
        west: ['air', 'grass']
      }
    }
  ];
}

/**
 * Create dungeon tileset with constraints
 */
export function createDungeonTileset(): WFCTile[] {
  return [
    {
      id: 'wall',
      weight: 3,
      adjacencyRules: {
        north: ['wall', 'floor'],
        south: ['wall', 'floor'],
        east: ['wall', 'floor'],
        west: ['wall', 'floor']
      }
    },
    {
      id: 'floor',
      weight: 5,
      adjacencyRules: {
        north: ['floor', 'wall', 'door'],
        south: ['floor', 'wall', 'door'],
        east: ['floor', 'wall', 'door'],
        west: ['floor', 'wall', 'door']
      }
    },
    {
      id: 'door',
      weight: 1,
      adjacencyRules: {
        north: ['floor'],
        south: ['floor'],
        east: ['wall'],
        west: ['wall']
      }
    }
  ];
}

/**
 * Create water/land tileset
 */
export function createTerrainTileset(): WFCTile[] {
  return [
    {
      id: 'water',
      weight: 4,
      adjacencyRules: {
        north: ['water', 'sand'],
        south: ['water', 'sand'],
        east: ['water', 'sand'],
        west: ['water', 'sand']
      }
    },
    {
      id: 'sand',
      weight: 2,
      adjacencyRules: {
        north: ['sand', 'water', 'grass'],
        south: ['sand', 'water', 'grass'],
        east: ['sand', 'water', 'grass'],
        west: ['sand', 'water', 'grass']
      }
    },
    {
      id: 'grass',
      weight: 5,
      adjacencyRules: {
        north: ['grass', 'sand', 'dirt'],
        south: ['grass', 'sand', 'dirt'],
        east: ['grass', 'sand', 'dirt'],
        west: ['grass', 'sand', 'dirt']
      }
    },
    {
      id: 'dirt',
      weight: 3,
      adjacencyRules: {
        north: ['dirt', 'grass', 'stone'],
        south: ['dirt', 'grass', 'stone'],
        east: ['dirt', 'grass', 'stone'],
        west: ['dirt', 'grass', 'stone']
      }
    },
    {
      id: 'stone',
      weight: 2,
      adjacencyRules: {
        north: ['stone', 'dirt'],
        south: ['stone', 'dirt'],
        east: ['stone', 'dirt'],
        west: ['stone', 'dirt']
      }
    }
  ];
}

/**
 * Create custom tileset from adjacency rules object
 */
export function createCustomTileset(
  rules: Record<string, {
    weight: number;
    north: string[];
    south: string[];
    east: string[];
    west: string[];
  }>
): WFCTile[] {
  return Object.entries(rules).map(([id, rule]) => ({
    id,
    weight: rule.weight,
    adjacencyRules: {
      north: rule.north,
      south: rule.south,
      east: rule.east,
      west: rule.west
    }
  }));
}

/**
 * Generate platform-style tilemap (good for sidescrollers)
 */
export function generatePlatformTilemap(
  width: number,
  height: number,
  seed?: number
): string[][] | null {
  return collapse({
    width,
    height,
    tiles: createPlatformTileset(),
    seed,
    maxAttempts: 100
  });
}

/**
 * Generate dungeon-style tilemap
 */
export function generateDungeonTilemap(
  width: number,
  height: number,
  seed?: number
): string[][] | null {
  return collapse({
    width,
    height,
    tiles: createDungeonTileset(),
    seed,
    maxAttempts: 100
  });
}

/**
 * Generate terrain tilemap with water/land
 */
export function generateTerrainTilemap(
  width: number,
  height: number,
  seed?: number
): string[][] | null {
  return collapse({
    width,
    height,
    tiles: createTerrainTileset(),
    seed,
    maxAttempts: 100
  });
}

/**
 * Wrapper: Generate WFC map as TileData array (for tile generator service)
 */
export function generateWFCMap(params: WFCParams): import('../types/tilemap').TileData[][] {
  const result = collapse(params)
  
  // If collapse failed, return empty grid
  if (!result) {
    return Array(params.height).fill(null).map(() =>
      Array(params.width).fill(null).map(() => ({
        type: 'grass',
        color: '#4ade80'
      }))
    )
  }
  
  // Convert string[][] to TileData[][]
  const colorMap: Record<string, string> = {
    'grass': '#4ade80',
    'dirt': '#92400e',
    'stone': '#6b7280',
    'water': '#3b82f6',
    'platform': '#92400e',
    'wall': '#6b7280',
    'empty': '#000000'
  }
  
  return result.map(row =>
    row.map(type => ({
      type,
      color: colorMap[type] || '#4ade80'
    }))
  )
}

/**
 * Wrapper: Create basic WFC tileset (for tile generator service)
 */
export function createBasicWFCTiles(): WFCTile[] {
  return createPlatformTileset()
}


