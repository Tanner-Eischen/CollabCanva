/**
 * Parameter Validation
 * Validates and sanitizes tool parameters
 * PR-30: Task 8.1
 */

/**
 * Validate shape type
 */
export function validateShapeType(type: string): boolean {
  const validTypes = ['rectangle', 'circle', 'ellipse', 'polygon', 'star', 'line', 'path', 'text', 'rounded-rect'];
  return validTypes.includes(type.toLowerCase());
}

/**
 * Validate tile type
 */
export function validateTileType(type: string): boolean {
  const validTypes = ['grass', 'dirt', 'water', 'stone', 'flower'];
  return validTypes.includes(type.toLowerCase());
}

/**
 * Validate color format
 * Accepts hex colors (#RGB, #RRGGBB) and named colors
 */
export function validateColor(color: string): boolean {
  // Hex colors
  if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(color)) {
    return true;
  }
  
  // Named colors (basic set)
  const namedColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'black', 'white', 'gray', 'brown', 'cyan', 'magenta',
  ];
  return namedColors.includes(color.toLowerCase());
}

/**
 * Validate coordinates are within canvas bounds
 */
export function validateCoordinates(x: number, y: number): { valid: boolean; error?: string } {
  const MIN = 0;
  const MAX = 5000;
  
  if (typeof x !== 'number' || typeof y !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }
  
  if (isNaN(x) || isNaN(y)) {
    return { valid: false, error: 'Coordinates cannot be NaN' };
  }
  
  if (x < MIN || x > MAX) {
    return { valid: false, error: `X coordinate must be between ${MIN} and ${MAX}` };
  }
  
  if (y < MIN || y > MAX) {
    return { valid: false, error: `Y coordinate must be between ${MIN} and ${MAX}` };
  }
  
  return { valid: true };
}

/**
 * Validate dimensions (width/height)
 */
export function validateDimensions(width: number, height: number): { valid: boolean; error?: string } {
  const MIN = 1;
  const MAX = 2000;
  
  if (typeof width !== 'number' || typeof height !== 'number') {
    return { valid: false, error: 'Dimensions must be numbers' };
  }
  
  if (isNaN(width) || isNaN(height)) {
    return { valid: false, error: 'Dimensions cannot be NaN' };
  }
  
  if (width < MIN || width > MAX) {
    return { valid: false, error: `Width must be between ${MIN} and ${MAX}` };
  }
  
  if (height < MIN || height > MAX) {
    return { valid: false, error: `Height must be between ${MIN} and ${MAX}` };
  }
  
  return { valid: true };
}

/**
 * Validate rotation angle
 */
export function validateRotation(rotation: number): { valid: boolean; error?: string } {
  if (typeof rotation !== 'number' || isNaN(rotation)) {
    return { valid: false, error: 'Rotation must be a number' };
  }
  
  // Normalize to 0-360
  return { valid: true };
}

/**
 * Validate shape IDs array
 */
export function validateShapeIds(ids: any): { valid: boolean; error?: string } {
  if (!Array.isArray(ids)) {
    return { valid: false, error: 'Shape IDs must be an array' };
  }
  
  if (ids.length === 0) {
    return { valid: false, error: 'At least one shape ID is required' };
  }
  
  if (ids.length > 100) {
    return { valid: false, error: 'Cannot operate on more than 100 shapes at once' };
  }
  
  // Check all IDs are strings
  const allStrings = ids.every(id => typeof id === 'string' && id.length > 0);
  if (!allStrings) {
    return { valid: false, error: 'All shape IDs must be non-empty strings' };
  }
  
  return { valid: true };
}

/**
 * Validate tile coordinates
 */
export function validateTileCoords(row: number, col: number): { valid: boolean; error?: string } {
  const MIN = 0;
  const MAX = 1000;
  
  if (typeof row !== 'number' || typeof col !== 'number') {
    return { valid: false, error: 'Tile coordinates must be numbers' };
  }
  
  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return { valid: false, error: 'Tile coordinates must be integers' };
  }
  
  if (row < MIN || row > MAX || col < MIN || col > MAX) {
    return { valid: false, error: `Tile coordinates must be between ${MIN} and ${MAX}` };
  }
  
  return { valid: true };
}

/**
 * Sanitize string input
 * Removes potentially harmful characters
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Validate array length
 */
export function validateArrayLength(
  arr: any[],
  minLength: number,
  maxLength: number,
  name: string
): { valid: boolean; error?: string } {
  if (!Array.isArray(arr)) {
    return { valid: false, error: `${name} must be an array` };
  }
  
  if (arr.length < minLength) {
    return { valid: false, error: `${name} must have at least ${minLength} item(s)` };
  }
  
  if (arr.length > maxLength) {
    return { valid: false, error: `${name} cannot have more than ${maxLength} items` };
  }
  
  return { valid: true };
}

