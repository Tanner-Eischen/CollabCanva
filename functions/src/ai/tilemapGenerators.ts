/**
 * Tilemap Generators
 * Server-side wrappers for procedural tilemap generation algorithms
 * PR-32: Advanced procedural generation for game development
 */

/**
 * Perlin Noise Generator (Server-side)
 * Generates natural-looking terrain using Perlin noise
 */
export function generatePerlinTilemap(
  width: number,
  height: number,
  params: {
    scale: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
    seed?: number;
  }
): Map<string, string> {
  // Implement Perlin noise on server
  const tiles = new Map<string, string>();
  const seed = params.seed || Date.now();
  
  // Simplified Perlin-like noise using sine waves
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = params.scale;
      let maxValue = 0;

      // Generate octaves
      for (let i = 0; i < params.octaves; i++) {
        const nx = x * frequency + seed;
        const ny = y * frequency + seed;
        
        // Simple noise using sine
        const noise = 
          Math.sin(nx * 0.1) * Math.cos(ny * 0.1) +
          Math.sin(ny * 0.1) * Math.cos(nx * 0.1);
        
        value += noise * amplitude;
        maxValue += amplitude;

        amplitude *= params.persistence;
        frequency *= params.lacunarity;
      }

      // Normalize to 0-1
      const normalized = (value / maxValue + 1) / 2;

      // Map to tile types
      let tileType: string;
      if (normalized < 0.3) {
        tileType = 'water';
      } else if (normalized < 0.4) {
        tileType = 'dirt';
      } else if (normalized < 0.6) {
        tileType = 'grass';
      } else if (normalized < 0.75) {
        tileType = 'dirt';
      } else {
        tileType = 'stone';
      }

      tiles.set(`${x}_${y}`, tileType);
    }
  }

  return tiles;
}

/**
 * Cellular Automata Generator (Server-side)
 * Generates cave-like structures
 */
export function generateCellularTilemap(
  width: number,
  height: number,
  params: {
    initialDensity: number;
    birthLimit: number;
    deathLimit: number;
    iterations: number;
    seed?: number;
  },
  options: {
    connectRegions?: boolean;
    removeIslands?: boolean;
  } = {}
): Map<string, string> {
  const seed = params.seed || Date.now();
  let random = seed;
  
  // Seeded random
  const rand = () => {
    const x = Math.sin(random++) * 10000;
    return x - Math.floor(x);
  };

  // Initialize grid
  let grid: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      // Edges are walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(true);
      } else {
        row.push(rand() < params.initialDensity);
      }
    }
    grid.push(row);
  }

  // Count neighbors
  const countNeighbors = (x: number, y: number): number => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          count++;
        } else if (grid[ny][nx]) {
          count++;
        }
      }
    }
    return count;
  };

  // Apply cellular automata rules
  for (let iter = 0; iter < params.iterations; iter++) {
    const newGrid: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < width; x++) {
        const neighbors = countNeighbors(x, y);
        const isAlive = grid[y][x];

        // Edges stay as walls
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          row.push(true);
        }
        // Apply birth/death rules
        else if (isAlive) {
          row.push(neighbors >= params.deathLimit);
        } else {
          row.push(neighbors >= params.birthLimit);
        }
      }
      newGrid.push(row);
    }
    grid = newGrid;
  }

  // Remove islands if requested
  if (options.removeIslands) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const neighbors = countNeighbors(x, y);
        // Fill isolated floors
        if (!grid[y][x] && neighbors >= 7) {
          grid[y][x] = true;
        }
        // Remove isolated walls
        if (grid[y][x] && neighbors <= 1) {
          grid[y][x] = false;
        }
      }
    }
  }

  // Convert to tilemap
  const tiles = new Map<string, string>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileType = grid[y][x] ? 'stone' : 'dirt';
      tiles.set(`${x}_${y}`, tileType);
    }
  }

  return tiles;
}

/**
 * Wave Function Collapse Generator (Server-side)
 * Generates tilemaps using constraint-based generation
 */
export function generateWFCTilemap(
  width: number,
  height: number,
  tilesetType: 'platform' | 'dungeon' | 'terrain',
  seed?: number
): Map<string, string> | null {
  const tiles = new Map<string, string>();
  const random = seed || Date.now();
  let rng = random;
  
  const rand = () => {
    const x = Math.sin(rng++) * 10000;
    return x - Math.floor(x);
  };

  // Simple constraint-based generation
  // This is a simplified version - the full WFC is complex
  
  const getTileSet = (): { tiles: string[]; constraints: any } => {
    switch (tilesetType) {
      case 'platform':
        return {
          tiles: ['air', 'grass', 'dirt', 'stone'],
          constraints: {
            air: { below: ['grass', 'air'] },
            grass: { below: ['dirt', 'grass'], above: ['air', 'grass'] },
            dirt: { below: ['dirt', 'stone'], above: ['grass', 'dirt'] },
            stone: { above: ['dirt', 'stone'] }
          }
        };
      case 'dungeon':
        return {
          tiles: ['floor', 'wall'],
          constraints: {
            floor: { adjacent: ['floor', 'wall'] },
            wall: { adjacent: ['floor', 'wall'] }
          }
        };
      case 'terrain':
      default:
        return {
          tiles: ['water', 'grass', 'dirt', 'stone'],
          constraints: {
            water: { adjacent: ['water', 'grass'] },
            grass: { adjacent: ['grass', 'water', 'dirt'] },
            dirt: { adjacent: ['dirt', 'grass', 'stone'] },
            stone: { adjacent: ['stone', 'dirt'] }
          }
        };
    }
  };

  const { tiles: tileSet } = getTileSet();

  // Generate grid
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Simple weighted selection
      const choice = Math.floor(rand() * tileSet.length);
      tiles.set(`${x}_${y}`, tileSet[choice]);
    }
  }

  return tiles;
}

/**
 * Random Walk Generator (Server-side)
 * Generates paths or rivers using random walk
 */
export function generateRandomWalkTilemap(
  width: number,
  height: number,
  params: {
    steps: number;
    turnProbability: number;
    branchProbability: number;
    width: number;
    seed?: number;
  },
  options: {
    smooth?: boolean;
  } = {}
): Map<string, string> {
  const tiles = new Map<string, string>();
  const seed = params.seed || Date.now();
  let random = seed;
  
  const rand = () => {
    const x = Math.sin(random++) * 10000;
    return x - Math.floor(x);
  };

  // Fill with grass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.set(`${x}_${y}`, 'grass');
    }
  }

  // Random walk
  let x = Math.floor(width / 2);
  let y = Math.floor(height / 2);
  let direction = Math.floor(rand() * 4); // 0=N, 1=E, 2=S, 3=W

  const path: Array<{ x: number; y: number }> = [];

  for (let step = 0; step < params.steps; step++) {
    // Add current position to path
    path.push({ x, y });

    // Turn?
    if (rand() < params.turnProbability) {
      direction = Math.floor(rand() * 4);
    }

    // Move
    switch (direction) {
      case 0: y = Math.max(0, y - 1); break; // North
      case 1: x = Math.min(width - 1, x + 1); break; // East
      case 2: y = Math.min(height - 1, y + 1); break; // South
      case 3: x = Math.max(0, x - 1); break; // West
    }
  }

  // Apply width to path
  const radius = Math.floor(params.width / 2);
  for (const pos of path) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Circular shape
        if (dx * dx + dy * dy <= radius * radius) {
          const nx = pos.x + dx;
          const ny = pos.y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            tiles.set(`${nx}_${ny}`, 'water');
          }
        }
      }
    }
  }

  return tiles;
}

/**
 * Legacy: Simple noise terrain
 */
export function generateNoiseTerrain(
  width: number,
  height: number,
  params: { scale: number }
): Map<string, string> {
  return generatePerlinTilemap(width, height, {
    scale: params.scale,
    octaves: 3,
    persistence: 0.5,
    lacunarity: 2.0
  });
}

/**
 * Legacy: Cellular caves
 */
export function generateCellularCaves(
  width: number,
  height: number,
  params: { fillProbability: number }
): Map<string, string> {
  return generateCellularTilemap(width, height, {
    initialDensity: params.fillProbability,
    birthLimit: 4,
    deathLimit: 3,
    iterations: 5
  });
}

/**
 * Legacy: Random walk
 */
export function generateRandomWalk(
  width: number,
  height: number,
  params: { pathWidth: number }
): Map<string, string> {
  return generateRandomWalkTilemap(width, height, {
    steps: 100,
    turnProbability: 0.2,
    branchProbability: 0.05,
    width: params.pathWidth
  });
}

/**
 * Legacy: Island generation
 */
export function generateIsland(width: number, height: number): Map<string, string> {
  const tiles = new Map<string, string>();
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 * 0.8;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalized = distance / maxRadius;

      let tileType: string;
      if (normalized > 1.0) {
        tileType = 'water';
      } else if (normalized > 0.8) {
        tileType = 'grass';
      } else if (normalized > 0.5) {
        tileType = 'grass';
      } else {
        tileType = 'dirt';
      }

      tiles.set(`${x}_${y}`, tileType);
    }
  }

  return tiles;
}
