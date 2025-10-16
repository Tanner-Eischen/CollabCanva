// Color Storage Service - Recent colors persistence (PR-15)

const RECENT_COLORS_KEY = 'collabcanvas_recent_colors'
const MAX_RECENT_COLORS = 5

/**
 * Save recent colors to localStorage
 */
export function saveRecentColors(colors: string[]): void {
  try {
    const toSave = colors.slice(0, MAX_RECENT_COLORS)
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.error('Failed to save recent colors:', error)
  }
}

/**
 * Load recent colors from localStorage
 * Returns empty array if no colors saved or error occurs
 */
export function loadRecentColors(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_COLORS_KEY)
    if (!saved) {
      return []
    }
    
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) {
      return []
    }
    
    // Validate that all items are strings
    return parsed.filter((item) => typeof item === 'string').slice(0, MAX_RECENT_COLORS)
  } catch (error) {
    console.error('Failed to load recent colors:', error)
    return []
  }
}

/**
 * Clear recent colors from localStorage
 */
export function clearRecentColors(): void {
  try {
    localStorage.removeItem(RECENT_COLORS_KEY)
  } catch (error) {
    console.error('Failed to clear recent colors:', error)
  }
}

