/**
 * Tile Resolution Service
 * Converts semantic tile names (like "grass.center") to tile indices
 * PR-31: Semantic Tile Name Resolution
 */

/**
 * Context for tile resolution
 */
export interface TileResolutionContext {
  namedTiles: Record<string, number>;
  tileGroups?: Record<string, any>;
  autoTileSystem?: string;
  fallbackTile?: number;
}

/**
 * Result of a tile resolution attempt
 */
export interface TileResolutionResult {
  identifier: string | number;
  resolved: number;
  found: boolean;
  method: 'direct' | 'named' | 'group' | 'fallback' | 'passthrough';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Resolve a tile identifier (name or number) to an index
 * Supports:
 * - Direct numeric indices (e.g., 15)
 * - Semantic names (e.g., "grass.center")
 * - Group references (e.g., "grass.*" → returns first grass tile)
 * - Fallback to default tile
 */
export function resolveTileIdentifier(
  identifier: string | number,
  context: TileResolutionContext
): { index: number; found: boolean } {
  // Direct numeric: pass through
  if (typeof identifier === 'number') {
    return { index: identifier, found: true };
  }

  // Try exact match first
  if (identifier in context.namedTiles) {
    return { index: context.namedTiles[identifier], found: true };
  }

  // Try partial match (e.g., "grass" → "grass.center")
  const partialMatches = Object.keys(context.namedTiles).filter(name =>
    name.startsWith(`${identifier}.`) || name.startsWith(`${identifier}_`)
  );

  if (partialMatches.length > 0) {
    // Prefer center tile if available
    const centerMatch = partialMatches.find(name =>
      name.endsWith('.center') || name.endsWith('_center')
    );
    const tileIndex = centerMatch
      ? context.namedTiles[centerMatch]
      : context.namedTiles[partialMatches[0]];
    return { index: tileIndex, found: true };
  }

  // Try case-insensitive match
  const lowerIdentifier = identifier.toLowerCase();
  const caseInsensitiveMatch = Object.entries(context.namedTiles).find(
    ([name]) => name.toLowerCase() === lowerIdentifier
  );

  if (caseInsensitiveMatch) {
    return { index: caseInsensitiveMatch[1], found: true };
  }

  // Fallback to default tile or 0
  const fallback = context.fallbackTile ?? 0;
  return { index: fallback, found: false };
}

/**
 * Resolve multiple tiles with smart fallbacks and caching
 */
export function resolveTileBatch(
  identifiers: Array<string | number>,
  context: TileResolutionContext,
  options: { cache?: Map<string | number, number>; skipMissing?: boolean } = {}
): number[] {
  const cache = options.cache || new Map();
  const results: number[] = [];

  for (const id of identifiers) {
    // Check cache first
    const cacheKey = typeof id === 'string' ? id.toLowerCase() : id;
    if (cache.has(cacheKey)) {
      results.push(cache.get(cacheKey)!);
      continue;
    }

    const resolution = resolveTileIdentifier(id, context);

    // Skip unresolved if requested
    if (!resolution.found && options.skipMissing) {
      continue;
    }

    results.push(resolution.index);
    cache.set(cacheKey, resolution.index);
  }

  return results;
}

/**
 * Get all tile variations for a material
 * Example: getMaterialVariations('grass', context) → 
 *   { center: 15, edge_n: 8, corner_nw: 2, ... }
 */
export function getMaterialVariations(
  material: string,
  context: TileResolutionContext
): Record<string, number> {
  const variations: Record<string, number> = {};
  const materialPrefix = `${material}.`;
  const materialPrefixUnderscore = `${material}_`;

  for (const [name, index] of Object.entries(context.namedTiles)) {
    if (name.startsWith(materialPrefix)) {
      const variant = name.substring(materialPrefix.length);
      variations[variant] = index;
    } else if (name.startsWith(materialPrefixUnderscore)) {
      const variant = name.substring(materialPrefixUnderscore.length);
      variations[variant] = index;
    }
  }

  return variations;
}

/**
 * Get all materials (base names) from named tiles
 */
export function getAllMaterials(context: TileResolutionContext): string[] {
  const materials = new Set<string>();

  for (const name of Object.keys(context.namedTiles)) {
    // Extract material name before first dot or underscore
    const match = name.match(/^([^._]+)[._]/);
    if (match) {
      materials.add(match[1]);
    }
  }

  return Array.from(materials).sort();
}

/**
 * Resolve with detailed result info
 */
export function resolveTileWithDetails(
  identifier: string | number,
  context: TileResolutionContext
): TileResolutionResult {
  // Direct numeric: pass through with high confidence
  if (typeof identifier === 'number') {
    return {
      identifier,
      resolved: identifier,
      found: true,
      method: 'passthrough',
      confidence: 'high',
    };
  }

  // Try exact match
  if (identifier in context.namedTiles) {
    return {
      identifier,
      resolved: context.namedTiles[identifier],
      found: true,
      method: 'named',
      confidence: 'high',
    };
  }

  // Try partial match
  const partialMatches = Object.keys(context.namedTiles).filter(name =>
    name.startsWith(`${identifier}.`) || name.startsWith(`${identifier}_`)
  );

  if (partialMatches.length > 0) {
    const centerMatch = partialMatches.find(name =>
      name.endsWith('.center') || name.endsWith('_center')
    );
    const resolved = centerMatch
      ? context.namedTiles[centerMatch]
      : context.namedTiles[partialMatches[0]];

    return {
      identifier,
      resolved,
      found: true,
      method: 'group',
      confidence: centerMatch ? 'high' : 'medium',
    };
  }

  // Try case-insensitive
  const lowerIdentifier = identifier.toLowerCase();
  const caseInsensitiveMatch = Object.entries(context.namedTiles).find(
    ([name]) => name.toLowerCase() === lowerIdentifier
  );

  if (caseInsensitiveMatch) {
    return {
      identifier,
      resolved: caseInsensitiveMatch[1],
      found: true,
      method: 'named',
      confidence: 'medium',
    };
  }

  // Fallback
  const fallback = context.fallbackTile ?? 0;
  return {
    identifier,
    resolved: fallback,
    found: false,
    method: 'fallback',
    confidence: 'low',
  };
}

/**
 * Build suggestion list for autocomplete-like scenarios
 */
export function getSuggestions(
  query: string,
  context: TileResolutionContext,
  limit: number = 10
): string[] {
  const lowerQuery = query.toLowerCase();
  const matches = Object.keys(context.namedTiles)
    .filter(name => name.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      // Prioritize exact prefix matches
      const aStartsWith = a.toLowerCase().startsWith(lowerQuery);
      const bStartsWith = b.toLowerCase().startsWith(lowerQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return a.localeCompare(b);
    })
    .slice(0, limit);

  return matches;
}
