/**
 * Visual Sprite Detection
 * Uses computer vision to detect individual sprites in a sprite sheet
 * Analyzes transparency, edges, and connected components
 */

import {
  analyzeImageColors,
  clampPalette,
  suggestMaterialsFromColors,
  suggestThemesFromColors
} from '../colorAnalysis';

export interface SpriteClassification {
  category: string;
  confidence: number;
  tags: string[];
  dominantColors: string[];
}

export interface DetectedSprite {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  confidence: number;
  classification?: SpriteClassification;
}

export interface SpriteDetectionResult {
  sprites: DetectedSprite[];
  gridDetected: boolean;
  suggestedTileSize?: { width: number; height: number };
  method: 'grid' | 'transparency' | 'edge-detection';
  palette?: string[];
  inferredMaterials?: string[];
  inferredThemes?: string[];
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

        // Classify each sprite
        const spritesWithClassification = snappedSprites.map(sprite => {
          const spriteData = ctx.getImageData(sprite.x, sprite.y, sprite.width, sprite.height);
          const classification = classifySprite(spriteData, sprite);
          return { ...sprite, classification };
        });

        // Check if sprites form a grid pattern
        const gridInfo = detectGridPattern(spritesWithClassification);

        // Global color summary for the sheet
        const globalAnalysis = analyzeImageColors(imageData, { sampleStep: 6, maxColors: 8 });
        const globalPalette = clampPalette(globalAnalysis.dominant);

        resolve({
          sprites: spritesWithClassification,
          gridDetected: gridInfo.isGrid,
          suggestedTileSize: gridInfo.tileSize,
          method: 'transparency',
          palette: globalPalette,
          inferredMaterials: suggestMaterialsFromColors(globalAnalysis),
          inferredThemes: suggestThemesFromColors(globalAnalysis).map(t => t.theme)
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

function classifySprite(imageData: ImageData, sprite: DetectedSprite): SpriteClassification {
  const analysis = analyzeImageColors(imageData, { sampleStep: 2, maxColors: 6, alphaThreshold: 20 });
  const palette = clampPalette(analysis.dominant, 5);
  const totalPixels = imageData.width * imageData.height;

  let opaquePixels = 0;
  let topOpaque = 0;
  let bottomOpaque = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3];
    if (alpha > 20) {
      opaquePixels++;
      const pixelIndex = i / 4;
      const y = Math.floor(pixelIndex / imageData.width);
      if (y < imageData.height / 3) topOpaque++;
      if (y > (imageData.height * 2) / 3) bottomOpaque++;
    }
  }

  const fillRatio = opaquePixels / Math.max(totalPixels, 1);
  const canopyRatio = topOpaque / Math.max(opaquePixels, 1);
  const baseRatio = bottomOpaque / Math.max(opaquePixels, 1);

  const totalHue = analysis.hueHistogram.reduce((sum, value) => sum + value, 0) || 1;
  const hueRatio = (start: number, end: number) => {
    let total = 0;
    for (let i = start; i < end; i++) total += analysis.hueHistogram[i];
    return total / totalHue;
  };

  const green = hueRatio(9, 15);
  const yellow = hueRatio(4, 9);
  const blue = hueRatio(18, 25);
  const red = hueRatio(0, 4) + hueRatio(35, 36);
  const brown = hueRatio(2, 5);
  const purple = hueRatio(25, 32);

  const aspect = sprite.height / Math.max(sprite.width, 1);
  const area = sprite.width * sprite.height;

  let category = 'object';
  let confidence = 0.45;
  const tags = new Set<string>(['sprite']);

  const hasGreenDominant = analysis.dominant.some(color => color.hue >= 80 && color.hue <= 160 && color.ratio > 0.12)

  if ((green > 0.22 || hasGreenDominant) && aspect > 1.2 && canopyRatio > 0.35 && baseRatio < 0.55) {
    category = 'tree';
    confidence = 0.82;
    tags.add('nature');
    tags.add('foliage');
  } else if (green > 0.2 && fillRatio < 0.55 && area < 2000) {
    category = 'bush';
    confidence = 0.7;
    tags.add('nature');
  } else if (blue > 0.25 && fillRatio > 0.45) {
    category = aspect > 1.3 ? 'waterfall' : 'water_feature';
    confidence = 0.78;
    tags.add('water');
  } else if (brown > 0.25 && aspect > 1.1 && fillRatio > 0.6) {
    category = 'structure';
    confidence = 0.68;
    tags.add('building');
  } else if (yellow > 0.22 && area < 1200) {
    category = 'item';
    confidence = 0.65;
    tags.add('collectible');
  } else if (purple > 0.2 && fillRatio > 0.4) {
    category = 'crystal';
    confidence = 0.72;
    tags.add('magic');
  } else if (analysis.averageLightness > 0.78 && analysis.averageSaturation < 0.25) {
    category = 'light_source';
    confidence = 0.6;
    tags.add('illumination');
  } else if (area <= 400 && fillRatio > 0.35) {
    category = 'decor';
    confidence = 0.55;
  }

  if (green > 0.18) tags.add('green');
  if (blue > 0.18) tags.add('blue');
  if (red > 0.18) tags.add('red');
  if (palette.length === 0) palette.push('#888888');

  return {
    category,
    confidence,
    tags: Array.from(tags),
    dominantColors: palette
  };
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
export function detectedSpritesToSelections(sprites: DetectedSprite[], baseName?: string) {
  // Use provided base name or fallback to "sprite"
  const base = baseName || 'sprite';
  const timestamp = Date.now();

  return sprites.map((sprite, index) => {
    const classification = sprite.classification;
    const categorySlug = classification?.category
      ? classification.category.toLowerCase().replace(/\s+/g, '-')
      : undefined;
    const nameParts = [base];
    if (categorySlug && categorySlug !== 'object') {
      nameParts.push(categorySlug);
    }
    const name = `${nameParts.join('_')}_${String(index).padStart(2, '0')}`;

    return {
      id: `detected_${timestamp}_${index}`,
      name,
      x: sprite.x,
      y: sprite.y,
      width: sprite.width,
      height: sprite.height,
      category: classification?.category,
      confidence: classification?.confidence,
      dominantColors: classification?.dominantColors ? [...classification.dominantColors] : undefined,
      tags: classification?.tags ? [...classification.tags] : undefined
    };
  });
}

export const __spriteDetectionInternals = {
  classifySprite,
  detectGridPattern,
  mergeNearbySprites
};

