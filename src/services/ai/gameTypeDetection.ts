/**
 * Game Type Detection Service
 * Analyzes canvas content to detect game type and patterns
 * PR-32: AI Game-Aware Enhancement
 */

import type { Shape } from '../../types/canvas';

export type GameType = 'platformer' | 'top-down' | 'puzzle' | 'shooter' | 'unknown';

export interface GameTypeDetection {
  type: GameType;
  confidence: number; // 0-1
  reasoning: string[];
  features: string[];
}

export interface GameFeatures {
  commonAssets: string[];
  typicalObjects: string[];
  levelStructure: string;
  cameraStyle: string;
  controls: string;
}

/**
 * Detect game type from canvas objects and tilemap
 */
export function detectGameType(
  objects: Shape[],
  tilemapSize?: { width: number; height: number },
  tileCount?: number
): GameTypeDetection {
  const scores = {
    platformer: 0,
    'top-down': 0,
    puzzle: 0,
    shooter: 0,
    unknown: 0
  };

  const reasoning: string[] = [];
  const features: string[] = [];

  // Analyze object layout
  const { horizontalLayers, verticalDistribution, gridLike } = analyzeObjectLayout(objects);

  // Platformer detection
  if (horizontalLayers > 2) {
    scores.platformer += 30;
    reasoning.push('Objects arranged in horizontal layers');
    features.push('Platform layers detected');
  }

  if (verticalDistribution === 'bottom-heavy') {
    scores.platformer += 20;
    reasoning.push('Objects concentrated near bottom (gravity-implied)');
  }

  // Top-down detection
  if (gridLike) {
    scores['top-down'] += 25;
    scores.puzzle += 25;
    reasoning.push('Objects arranged in grid pattern');
    features.push('Grid-based layout');
  }

  if (tilemapSize && tilemapSize.width === tilemapSize.height) {
    scores['top-down'] += 15;
    reasoning.push('Square tilemap (common in top-down games)');
  }

  if (verticalDistribution === 'even') {
    scores['top-down'] += 20;
    reasoning.push('Even vertical distribution');
  }

  // Puzzle detection
  if (objects.length < 50 && gridLike) {
    scores.puzzle += 30;
    reasoning.push('Few objects in regular grid (puzzle-like)');
    features.push('Puzzle grid structure');
  }

  // Analyze tilemap
  if (tilemapSize && tileCount) {
    const density = tileCount / (tilemapSize.width * tilemapSize.height);
    
    if (density > 0.7) {
      scores['top-down'] += 15;
      scores.puzzle += 10;
      reasoning.push('Dense tilemap (walls/floors)');
    }

    if (density < 0.3 && density > 0.05) {
      scores.platformer += 20;
      reasoning.push('Sparse tilemap (platforms)');
      features.push('Platform-based level');
    }
  }

  // Analyze object types
  const objectTypes = countObjectTypes(objects);

  if (objectTypes.rectangles > objectTypes.circles * 2) {
    scores.platformer += 10;
    scores['top-down'] += 5;
    reasoning.push('Many rectangles (platforms/walls)');
  }

  if (objectTypes.circles > 5) {
    scores.shooter += 15;
    reasoning.push('Multiple circles (possibly projectiles/enemies)');
  }

  // Size analysis
  if (tilemapSize) {
    const aspectRatio = tilemapSize.width / tilemapSize.height;
    
    if (aspectRatio > 2) {
      scores.platformer += 15;
      reasoning.push('Wide aspect ratio (side-scrolling)');
      features.push('Side-scrolling layout');
    }

    if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
      scores['top-down'] += 10;
      reasoning.push('Nearly square layout');
    }
  }

  // Find winner
  let bestType: GameType = 'unknown';
  let bestScore = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type as GameType;
    }
  }

  // Calculate confidence (normalize score to 0-1)
  const confidence = Math.min(bestScore / 100, 1.0);

  // If confidence too low, mark as unknown
  if (confidence < 0.3) {
    bestType = 'unknown';
    reasoning.push('Not enough evidence for specific game type');
  }

  return {
    type: bestType,
    confidence,
    reasoning,
    features
  };
}

/**
 * Analyze object layout patterns
 */
function analyzeObjectLayout(objects: Shape[]): {
  horizontalLayers: number;
  verticalDistribution: 'bottom-heavy' | 'top-heavy' | 'even';
  gridLike: boolean;
} {
  if (objects.length === 0) {
    return { horizontalLayers: 0, verticalDistribution: 'even', gridLike: false };
  }

  // Detect horizontal layers
  const yPositions = objects.map(obj => obj.y).sort((a, b) => a - b);
  const layerThreshold = 50; // pixels
  const layers = new Set<number>();
  
  for (const y of yPositions) {
    const layer = Math.floor(y / layerThreshold);
    layers.add(layer);
  }

  // Detect vertical distribution
  const minY = Math.min(...yPositions);
  const maxY = Math.max(...yPositions);
  const range = maxY - minY;
  const topThird = minY + range / 3;
  const bottomThird = maxY - range / 3;

  const topCount = objects.filter(obj => obj.y < topThird).length;
  const bottomCount = objects.filter(obj => obj.y > bottomThird).length;

  let verticalDistribution: 'bottom-heavy' | 'top-heavy' | 'even';
  if (bottomCount > topCount * 1.5) {
    verticalDistribution = 'bottom-heavy';
  } else if (topCount > bottomCount * 1.5) {
    verticalDistribution = 'top-heavy';
  } else {
    verticalDistribution = 'even';
  }

  // Detect grid-like arrangement
  const xPositions = objects.map(obj => obj.x).sort((a, b) => a - b);
  const gridLike = isGridLike(xPositions, yPositions);

  return {
    horizontalLayers: layers.size,
    verticalDistribution,
    gridLike
  };
}

/**
 * Check if positions form a grid
 */
function isGridLike(xPositions: number[], yPositions: number[]): boolean {
  if (xPositions.length < 9) return false; // Need at least 3x3 grid

  // Check for regular spacing
  const xSpacings = new Map<number, number>();
  for (let i = 1; i < xPositions.length; i++) {
    const spacing = Math.round((xPositions[i] - xPositions[i - 1]) / 10) * 10;
    xSpacings.set(spacing, (xSpacings.get(spacing) || 0) + 1);
  }

  const ySpacings = new Map<number, number>();
  for (let i = 1; i < yPositions.length; i++) {
    const spacing = Math.round((yPositions[i] - yPositions[i - 1]) / 10) * 10;
    ySpacings.set(spacing, (ySpacings.get(spacing) || 0) + 1);
  }

  // If one spacing dominates, it's grid-like
  const maxXSpacing = Math.max(...Array.from(xSpacings.values()));
  const maxYSpacing = Math.max(...Array.from(ySpacings.values()));

  return maxXSpacing > xPositions.length * 0.4 && maxYSpacing > yPositions.length * 0.4;
}

/**
 * Count object types
 */
function countObjectTypes(objects: Shape[]): {
  rectangles: number;
  circles: number;
  text: number;
  lines: number;
  other: number;
} {
  const counts = {
    rectangles: 0,
    circles: 0,
    text: 0,
    lines: 0,
    other: 0
  };

  for (const obj of objects) {
    switch (obj.type) {
      case 'rectangle':
      case 'roundRect':
        counts.rectangles++;
        break;
      case 'circle':
        counts.circles++;
        break;
      case 'text':
        counts.text++;
        break;
      case 'line':
        counts.lines++;
        break;
      default:
        counts.other++;
    }
  }

  return counts;
}

/**
 * Get typical features for a game type
 */
export function getGameTypeFeatures(type: GameType): GameFeatures {
  switch (type) {
    case 'platformer':
      return {
        commonAssets: ['platform sprites', 'character sprite', 'background layers', 'collectibles'],
        typicalObjects: ['platforms', 'player spawn', 'enemies', 'coins', 'hazards'],
        levelStructure: 'Horizontal layers with gaps, gravity-based movement',
        cameraStyle: 'Side-scrolling (horizontal follow)',
        controls: 'Left/Right movement, Jump, optional abilities'
      };

    case 'top-down':
      return {
        commonAssets: ['wall tiles', 'floor tiles', 'character sprite (4-8 directions)', 'objects'],
        typicalObjects: ['walls', 'doors', 'NPCs', 'items', 'decorations'],
        levelStructure: 'Room-based or open world, walls define boundaries',
        cameraStyle: 'Top-down (centered on player)',
        controls: '8-directional or 4-directional movement, interaction'
      };

    case 'puzzle':
      return {
        commonAssets: ['tile sprites', 'UI elements', 'particle effects'],
        typicalObjects: ['tiles', 'pieces', 'targets', 'obstacles'],
        levelStructure: 'Grid-based, discrete positions',
        cameraStyle: 'Static or gentle pan',
        controls: 'Point and click, or directional input for tile movement'
      };

    case 'shooter':
      return {
        commonAssets: ['ship/character sprite', 'enemy sprites', 'projectile sprites', 'effects'],
        typicalObjects: ['player', 'enemies', 'projectiles', 'power-ups'],
        levelStructure: 'Open space with waves of enemies',
        cameraStyle: 'Follow player or fixed camera',
        controls: 'Movement (4 or 8 directions), shoot, special abilities'
      };

    default:
      return {
        commonAssets: [],
        typicalObjects: [],
        levelStructure: 'Unknown',
        cameraStyle: 'Unknown',
        controls: 'Unknown'
      };
  }
}

/**
 * Get suggested next steps based on game type
 */
export function getSuggestedNextSteps(
  type: GameType,
  currentState: {
    hasPlayer?: boolean;
    hasEnemies?: boolean;
    hasTilemap?: boolean;
    hasAnimations?: boolean;
  }
): string[] {
  const suggestions: string[] = [];

  switch (type) {
    case 'platformer':
      if (!currentState.hasPlayer) {
        suggestions.push('Add player spawn point');
      }
      if (!currentState.hasTilemap) {
        suggestions.push('Generate platform terrain');
      }
      if (!currentState.hasEnemies) {
        suggestions.push('Place enemies on platforms');
      }
      suggestions.push('Add collectibles (coins, power-ups)');
      suggestions.push('Create parallax background layers');
      break;

    case 'top-down':
      if (!currentState.hasTilemap) {
        suggestions.push('Generate dungeon or room layout');
      }
      suggestions.push('Add walls and boundaries');
      suggestions.push('Place doors and transitions');
      if (!currentState.hasPlayer) {
        suggestions.push('Add player spawn point');
      }
      suggestions.push('Add NPCs or enemies');
      break;

    case 'puzzle':
      if (!currentState.hasTilemap) {
        suggestions.push('Create puzzle grid');
      }
      suggestions.push('Add puzzle pieces or tiles');
      suggestions.push('Define win condition areas');
      suggestions.push('Add UI elements (score, moves)');
      break;

    case 'shooter':
      if (!currentState.hasPlayer) {
        suggestions.push('Add player ship/character');
      }
      suggestions.push('Add enemy spawn points');
      suggestions.push('Create enemy wave patterns');
      suggestions.push('Add power-up spawners');
      suggestions.push('Create background with parallax');
      break;

    default:
      suggestions.push('Add more content to help detect game type');
      suggestions.push('Consider what kind of game you want to build');
  }

  return suggestions;
}

/**
 * Analyze game complexity
 */
export function analyzeGameComplexity(
  objectCount: number,
  tilemapSize?: { width: number; height: number },
  animationCount: number = 0
): 'low' | 'medium' | 'high' {
  let score = 0;

  // Object count
  if (objectCount > 200) score += 3;
  else if (objectCount > 100) score += 2;
  else if (objectCount > 30) score += 1;

  // Tilemap size
  if (tilemapSize) {
    const area = tilemapSize.width * tilemapSize.height;
    if (area > 10000) score += 3;
    else if (area > 2500) score += 2;
    else if (area > 400) score += 1;
  }

  // Animations
  if (animationCount > 10) score += 2;
  else if (animationCount > 3) score += 1;

  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
