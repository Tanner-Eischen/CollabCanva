/**
 * Visual Sprite Detection
 * Uses computer vision to detect individual sprites in a sprite sheet
 * Analyzes transparency, edges, and connected components
 */

export interface DetectedSprite {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  confidence: number;
}

export interface SpriteDetectionResult {
  sprites: DetectedSprite[];
  gridDetected: boolean;
  suggestedTileSize?: { width: number; height: number };
  method: 'grid' | 'transparency' | 'edge-detection';
}

/**
 * Detect individual sprites by analyzing transparency (alpha channel)
 * This works for sprite sheets with transparent backgrounds
 */
export async function detectSpritesByTransparency(
  imageUrl: string,
  minSpriteSize: number = 8,
  mergePadding: number = 2
): Promise<SpriteDetectionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Create canvas to analyze pixels
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Create occupancy map (which pixels are non-transparent)
        const occupancyMap: boolean[][] = [];
        for (let y = 0; y < canvas.height; y++) {
          occupancyMap[y] = [];
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const alpha = pixels[idx + 3];
            occupancyMap[y][x] = alpha > 10; // Consider pixels with alpha > 10 as occupied
          }
        }
        
        // Find connected components (individual sprites)
        const visited: boolean[][] = Array(canvas.height).fill(null).map(() => 
          Array(canvas.width).fill(false)
        );
        
        const sprites: DetectedSprite[] = [];
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (occupancyMap[y][x] && !visited[y][x]) {
              // Found a new sprite - flood fill to find its bounds
              const bounds = floodFill(occupancyMap, visited, x, y, canvas.width, canvas.height);
              
              // Only include if sprite is large enough
              if (bounds.width >= minSpriteSize && bounds.height >= minSpriteSize) {
                sprites.push({
                  x: bounds.x,
                  y: bounds.y,
                  width: bounds.width,
                  height: bounds.height,
                  area: bounds.width * bounds.height,
                  confidence: 0.8 // High confidence for transparency-based detection
                });
              }
            }
          }
        }
        
        // Merge nearby sprites (helps with multi-part sprites)
        const mergedSprites = mergeNearbySprites(sprites, mergePadding);
        
        // Snap sprites to 8px grid for game-friendly dimensions
        const snappedSprites = snapSpritesToGrid(mergedSprites, 8);
        
        // Check if sprites form a grid pattern
        const gridInfo = detectGridPattern(snappedSprites);
        
        resolve({
          sprites: snappedSprites,
          gridDetected: gridInfo.isGrid,
          suggestedTileSize: gridInfo.tileSize,
          method: 'transparency'
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Flood fill algorithm to find connected component bounds
 */
function floodFill(
  occupancyMap: boolean[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const stack: [number, number][] = [[startX, startY]];
  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x] || !occupancyMap[y][x]) continue;
    
    visited[y][x] = true;
    
    // Update bounds
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    
    // Check 4-connected neighbors
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
    
    // Also check 8-connected (diagonals) for better sprite detection
    stack.push([x + 1, y + 1]);
    stack.push([x + 1, y - 1]);
    stack.push([x - 1, y + 1]);
    stack.push([x - 1, y - 1]);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

/**
 * Merge sprites that are very close together
 * (handles multi-part sprites or sprites with small gaps)
 */
function mergeNearbySprites(sprites: DetectedSprite[], padding: number): DetectedSprite[] {
  if (sprites.length === 0) return [];
  
  const merged: DetectedSprite[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < sprites.length; i++) {
    if (used.has(i)) continue;
    
    let currentBounds = { ...sprites[i] };
    let merged_any = true;
    
    while (merged_any) {
      merged_any = false;
      
      for (let j = 0; j < sprites.length; j++) {
        if (i === j || used.has(j)) continue;
        
        const other = sprites[j];
        
        // Check if sprites are close enough to merge
        if (
          !(currentBounds.x + currentBounds.width + padding < other.x ||
            other.x + other.width + padding < currentBounds.x ||
            currentBounds.y + currentBounds.height + padding < other.y ||
            other.y + other.height + padding < currentBounds.y)
        ) {
          // Merge bounding boxes
          const newX = Math.min(currentBounds.x, other.x);
          const newY = Math.min(currentBounds.y, other.y);
          const newMaxX = Math.max(currentBounds.x + currentBounds.width, other.x + other.width);
          const newMaxY = Math.max(currentBounds.y + currentBounds.height, other.y + other.height);
          
          currentBounds = {
            x: newX,
            y: newY,
            width: newMaxX - newX,
            height: newMaxY - newY,
            area: (newMaxX - newX) * (newMaxY - newY),
            confidence: Math.max(currentBounds.confidence, other.confidence)
          };
          
          used.add(j);
          merged_any = true;
        }
      }
    }
    
    merged.push(currentBounds);
    used.add(i);
  }
  
  return merged;
}

/**
 * Detect if sprites form a grid pattern
 */
function detectGridPattern(sprites: DetectedSprite[]): {
  isGrid: boolean;
  tileSize?: { width: number; height: number };
  rows?: number;
  cols?: number;
} {
  if (sprites.length < 4) {
    return { isGrid: false };
  }
  
  // Sort sprites by position
  const sortedByY = [...sprites].sort((a, b) => a.y - b.y);
  const sortedByX = [...sprites].sort((a, b) => a.x - b.x);
  
  // Check if sprites have consistent sizes
  const widths = sprites.map(s => s.width);
  const heights = sprites.map(s => s.height);
  
  const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
  
  const widthVariance = widths.reduce((sum, w) => sum + Math.abs(w - avgWidth), 0) / widths.length;
  const heightVariance = heights.reduce((sum, h) => sum + Math.abs(h - avgHeight), 0) / heights.length;
  
  // If variance is low, it's likely a grid
  const isConsistentSize = widthVariance < avgWidth * 0.15 && heightVariance < avgHeight * 0.15;
  
  if (!isConsistentSize) {
    return { isGrid: false };
  }
  
  // Check for consistent spacing
  const xPositions = [...new Set(sprites.map(s => s.x))].sort((a, b) => a - b);
  const yPositions = [...new Set(sprites.map(s => s.y))].sort((a, b) => a - b);
  
  const cols = xPositions.length;
  const rows = yPositions.length;
  
  // Check if number of sprites matches grid
  const expectedSprites = rows * cols;
  const actualSprites = sprites.length;
  
  const isGrid = actualSprites >= expectedSprites * 0.8; // Allow some missing sprites
  
  return {
    isGrid,
    tileSize: isGrid ? { 
      width: Math.round(avgWidth), 
      height: Math.round(avgHeight) 
    } : undefined,
    rows,
    cols
  };
}

/**
 * Snap detected sprites to common tile sizes (multiples of 8)
 * Ensures x, y, width, height are all divisible by 8
 */
export function snapSpritesToGrid(
  sprites: DetectedSprite[],
  gridSize: number = 8
): DetectedSprite[] {
  return sprites.map(sprite => {
    // Snap x and y down to nearest grid point
    const snappedX = Math.floor(sprite.x / gridSize) * gridSize;
    const snappedY = Math.floor(sprite.y / gridSize) * gridSize;
    
    // Calculate right and bottom edges
    const right = sprite.x + sprite.width;
    const bottom = sprite.y + sprite.height;
    
    // Snap right and bottom up to nearest grid point
    const snappedRight = Math.ceil(right / gridSize) * gridSize;
    const snappedBottom = Math.ceil(bottom / gridSize) * gridSize;
    
    // Calculate snapped dimensions
    const snappedWidth = snappedRight - snappedX;
    const snappedHeight = snappedBottom - snappedY;
    
    return {
      ...sprite,
      x: snappedX,
      y: snappedY,
      width: snappedWidth,
      height: snappedHeight
    };
  });
}

/**
 * Convert detected sprites to sprite selections
 */
export function detectedSpritesToSelections(sprites: DetectedSprite[]) {
  return sprites.map((sprite, index) => ({
    id: `detected_${Date.now()}_${index}`,
    name: `Sprite ${index + 1}`,
    x: sprite.x,
    y: sprite.y,
    width: sprite.width,
    height: sprite.height
  }));
}

