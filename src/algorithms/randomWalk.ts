/**
 * Random Walk Generator
 * Implements path and river generation using random walk algorithm
 */

/**
 * Direction for random walk
 */
type Direction = 'north' | 'south' | 'east' | 'west';

/**
 * Parameters for random walk generation
 */
export interface RandomWalkParams {
  steps: number; // Length of walk (number of steps)
  turnProbability: number; // Chance to change direction (0-1)
  branchProbability: number; // Chance to split path (0-1)
  width: number; // Path thickness (1-10)
  seed?: number; // Seed for reproducible generation
}

/**
 * Default parameters for path generation
 */
export const DEFAULT_PATH_PARAMS: RandomWalkParams = {
  steps: 100,
  turnProbability: 0.2,
  branchProbability: 0.05,
  width: 2,
  seed: Date.now()
};

/**
 * Default parameters for river generation
 */
export const DEFAULT_RIVER_PARAMS: RandomWalkParams = {
  steps: 150,
  turnProbability: 0.15,
  branchProbability: 0.1,
  width: 3,
  seed: Date.now()
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

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

/**
 * Get direction vector
 */
function getDirectionVector(direction: Direction): { dx: number; dy: number } {
  switch (direction) {
    case 'north':
      return { dx: 0, dy: -1 };
    case 'south':
      return { dx: 0, dy: 1 };
    case 'east':
      return { dx: 1, dy: 0 };
    case 'west':
      return { dx: -1, dy: 0 };
  }
}

/**
 * Get perpendicular directions
 */
function getPerpendicularDirections(direction: Direction): Direction[] {
  switch (direction) {
    case 'north':
    case 'south':
      return ['east', 'west'];
    case 'east':
    case 'west':
      return ['north', 'south'];
  }
}

/**
 * Perform random walk and return list of coordinates
 */
export function generatePath(
  startX: number,
  startY: number,
  params: RandomWalkParams = DEFAULT_PATH_PARAMS
): Array<{ x: number; y: number }> {
  const random = new SeededRandom(params.seed || Date.now());
  const path: Array<{ x: number; y: number }> = [];
  const branches: Array<{
    x: number;
    y: number;
    direction: Direction;
    remainingSteps: number;
  }> = [];

  let x = startX;
  let y = startY;
  let direction: Direction = random.choice(['north', 'south', 'east', 'west']);

  // Main walk
  for (let step = 0; step < params.steps; step++) {
    path.push({ x, y });

    // Branch?
    if (random.next() < params.branchProbability && branches.length < 3) {
      const branchDirection = random.choice(
        getPerpendicularDirections(direction)
      );
      branches.push({
        x,
        y,
        direction: branchDirection,
        remainingSteps: Math.floor(params.steps * 0.3) // Branches are shorter
      });
    }

    // Turn?
    if (random.next() < params.turnProbability) {
      direction = random.choice(getPerpendicularDirections(direction));
    }

    // Move
    const { dx, dy } = getDirectionVector(direction);
    x += dx;
    y += dy;
  }

  // Process branches
  for (const branch of branches) {
    let bx = branch.x;
    let by = branch.y;
    let bDirection = branch.direction;

    for (let step = 0; step < branch.remainingSteps; step++) {
      path.push({ x: bx, y: by });

      // Branches turn less frequently
      if (random.next() < params.turnProbability * 0.5) {
        bDirection = random.choice(getPerpendicularDirections(bDirection));
      }

      const { dx, dy } = getDirectionVector(bDirection);
      bx += dx;
      by += dy;
    }
  }

  return path;
}

/**
 * Apply width to path coordinates
 */
export function thickenPath(
  path: Array<{ x: number; y: number }>,
  width: number
): Array<{ x: number; y: number }> {
  if (width <= 1) return path;

  const thickPath: Array<{ x: number; y: number }> = [];
  const added = new Set<string>();
  const radius = Math.floor(width / 2);

  for (const { x, y } of path) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Use circular shape instead of square
        if (dx * dx + dy * dy <= radius * radius) {
          const key = `${x + dx},${y + dy}`;
          if (!added.has(key)) {
            thickPath.push({ x: x + dx, y: y + dy });
            added.add(key);
          }
        }
      }
    }
  }

  return thickPath;
}

/**
 * Smooth path using Catmull-Rom spline (simplified)
 * Returns interpolated points between original path points
 */
export function smoothPath(
  path: Array<{ x: number; y: number }>,
  smoothness: number = 4
): Array<{ x: number; y: number }> {
  if (path.length < 3) return path;

  const smoothed: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[Math.max(0, i - 1)];
    const p1 = path[i];
    const p2 = path[i + 1];
    const p3 = path[Math.min(path.length - 1, i + 2)];

    for (let t = 0; t < smoothness; t++) {
      const u = t / smoothness;
      const uu = u * u;
      const uuu = uu * u;

      // Catmull-Rom spline formula (simplified)
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * uu +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * uuu);

      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * uu +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * uuu);

      smoothed.push({ x: Math.round(x), y: Math.round(y) });
    }
  }

  // Add last point
  smoothed.push(path[path.length - 1]);

  return smoothed;
}

/**
 * Apply variable width to path (organic-looking)
 */
export function applyWidthVariation(
  path: Array<{ x: number; y: number }>,
  baseWidth: number,
  variation: number = 0.3,
  seed?: number
): Array<{ x: number; y: number }> {
  const random = new SeededRandom(seed || Date.now());
  const result: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < path.length; i++) {
    const { x, y } = path[i];
    const widthMultiplier = 1 + (random.next() - 0.5) * variation;
    const width = Math.max(1, Math.round(baseWidth * widthMultiplier));

    // Add thickened point
    const thick = thickenPath([{ x, y }], width);
    result.push(...thick);
  }

  // Remove duplicates
  const unique = new Map<string, { x: number; y: number }>();
  for (const point of result) {
    unique.set(`${point.x},${point.y}`, point);
  }

  return Array.from(unique.values());
}

/**
 * Convert path coordinates to tilemap overlay
 * Places path tiles at coordinates, returns sparse map
 */
export function pathToTilemap(
  path: Array<{ x: number; y: number }>,
  pathTile: string = 'water'
): Map<string, string> {
  const tilemap = new Map<string, string>();

  for (const { x, y } of path) {
    tilemap.set(`${x},${y}`, pathTile);
  }

  return tilemap;
}

/**
 * Apply path to existing tilemap (overlay)
 */
export function applyPathToTilemap(
  baseTilemap: string[][],
  path: Array<{ x: number; y: number }>,
  pathTile: string = 'water'
): string[][] {
  const height = baseTilemap.length;
  const width = baseTilemap[0]?.length || 0;

  // Clone base tilemap
  const newTilemap = baseTilemap.map(row => [...row]);

  // Apply path
  for (const { x, y } of path) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      newTilemap[y][x] = pathTile;
    }
  }

  return newTilemap;
}

/**
 * Generate river across tilemap
 * Starts from one edge, walks to another
 */
export function generateRiver(
  width: number,
  height: number,
  params: RandomWalkParams = DEFAULT_RIVER_PARAMS,
  options: {
    smooth?: boolean;
    variableWidth?: boolean;
  } = {}
): Array<{ x: number; y: number }> {
  const { smooth = true, variableWidth = true } = options;

  // Start from random position on top edge
  const random = new SeededRandom(params.seed || Date.now());
  const startX = Math.floor(random.next() * width);
  const startY = 0;

  // Generate path towards bottom
  let path = generatePath(startX, startY, {
    ...params,
    steps: height * 2 // Ensure we reach bottom
  });

  // Filter path to bounds
  path = path.filter(({ x, y }) => x >= 0 && x < width && y >= 0 && y < height);

  // Smooth path
  if (smooth) {
    path = smoothPath(path, 3);
  }

  // Apply width
  if (variableWidth) {
    path = applyWidthVariation(path, params.width, 0.4, params.seed);
  } else {
    path = thickenPath(path, params.width);
  }

  return path;
}

/**
 * Generate complete path tilemap
 */
export function generatePathTilemap(
  width: number,
  height: number,
  startX: number,
  startY: number,
  params: RandomWalkParams = DEFAULT_PATH_PARAMS,
  options: {
    baseTile?: string;
    pathTile?: string;
    smooth?: boolean;
    variableWidth?: boolean;
  } = {}
): string[][] {
  const {
    baseTile = 'grass',
    pathTile = 'dirt',
    smooth = false,
    variableWidth = false
  } = options;

  // Initialize base tilemap
  const tilemap: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      row.push(baseTile);
    }
    tilemap.push(row);
  }

  // Generate path
  let path = generatePath(startX, startY, params);

  // Smooth if requested
  if (smooth) {
    path = smoothPath(path);
  }

  // Apply width
  if (variableWidth) {
    path = applyWidthVariation(path, params.width, 0.3, params.seed);
  } else {
    path = thickenPath(path, params.width);
  }

  // Apply to tilemap
  return applyPathToTilemap(tilemap, path, pathTile);
}

/**
 * Check if path connects two points (roughly)
 */
export function pathConnects(
  path: Array<{ x: number; y: number }>,
  targetX: number,
  targetY: number,
  threshold: number = 5
): boolean {
  for (const { x, y } of path) {
    const distance = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
    if (distance < threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Get path length (total distance traveled)
 */
export function getPathLength(path: Array<{ x: number; y: number }>): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Wrapper: Generate path as TileData array (for tile generator service)
 */
export function generateRandomWalkPath(
  width: number,
  height: number,
  params: Partial<RandomWalkParams> = {}
): import('../types/tilemap').TileData[][] {
  const fullParams = { ...DEFAULT_PATH_PARAMS, ...params }
  const path = generatePath(width, height, fullParams)
  const pathMap = pathToTilemap(path, 'dirt')
  
  // Create 2D array with grass background and dirt path
  const result: import('../types/tilemap').TileData[][] = []
  for (let y = 0; y < height; y++) {
    const row: import('../types/tilemap').TileData[] = []
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`
      const hasTile = pathMap.has(key)
      row.push({
        type: hasTile ? 'dirt' : 'grass',
        color: hasTile ? '#92400e' : '#4ade80'
      })
    }
    result.push(row)
  }
  return result
}

/**
 * Wrapper: Generate river as TileData array (for tile generator service)
 */
export function generateRandomWalkRiver(
  width: number,
  height: number,
  params: Partial<RandomWalkParams> = {}
): import('../types/tilemap').TileData[][] {
  const fullParams = { ...DEFAULT_RIVER_PARAMS, ...params }
  const river = generateRiver(width, height, fullParams)
  const riverMap = pathToTilemap(river, 'water')
  
  // Create 2D array with grass background and water river
  const result: import('../types/tilemap').TileData[][] = []
  for (let y = 0; y < height; y++) {
    const row: import('../types/tilemap').TileData[] = []
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`
      const hasTile = riverMap.has(key)
      row.push({
        type: hasTile ? 'water' : 'grass',
        color: hasTile ? '#3b82f6' : '#4ade80'
      })
    }
    result.push(row)
  }
  return result
}


