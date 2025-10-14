// Unit tests for Color Storage Service (PR-15)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadRecentColors, saveRecentColors } from '../../../src/services/colorStorage'

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null
  },
  setItem(key: string, value: string) {
    this.store[key] = value.toString()
  },
  removeItem(key: string) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('Color Storage Service (PR-15)', () => {
  beforeEach(() => {
    localStorageMock.store = {}
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.store = {}
  })

  describe('loadRecentColors', () => {
    it('should return empty array when no colors stored', () => {
      const colors = loadRecentColors()
      expect(colors).toEqual([])
    })

    it('should load colors from localStorage', () => {
      const testColors = ['#FF0000FF', '#00FF00FF', '#0000FFFF']
      localStorageMock.store['collabcanvas_recent_colors'] = JSON.stringify(testColors)

      const colors = loadRecentColors()
      expect(colors).toEqual(testColors)
    })

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.store['collabcanvas_recent_colors'] = 'invalid json'

      const colors = loadRecentColors()
      expect(colors).toEqual([])
    })

    it('should handle non-array data in localStorage', () => {
      localStorageMock.store['collabcanvas_recent_colors'] = JSON.stringify({ color: 'red' })

      const colors = loadRecentColors()
      expect(colors).toEqual([])
    })
  })

  describe('saveRecentColors', () => {
    it('should save colors to localStorage', () => {
      const testColors = ['#FF0000FF', '#00FF00FF']
      saveRecentColors(testColors)

      const stored = localStorageMock.store['collabcanvas_recent_colors']
      expect(stored).toBe(JSON.stringify(testColors))
    })

    it('should save empty array', () => {
      saveRecentColors([])

      const stored = localStorageMock.store['collabcanvas_recent_colors']
      expect(stored).toBe(JSON.stringify([]))
    })

    it('should overwrite existing colors', () => {
      const oldColors = ['#FF0000FF', '#00FF00FF']
      const newColors = ['#0000FFFF', '#FFFF00FF']

      saveRecentColors(oldColors)
      saveRecentColors(newColors)

      const stored = localStorageMock.store['collabcanvas_recent_colors']
      expect(stored).toBe(JSON.stringify(newColors))
    })

    it('should handle max 5 colors limit', () => {
      const colors = [
        '#FF0000FF',
        '#00FF00FF',
        '#0000FFFF',
        '#FFFF00FF',
        '#FF00FFFF',
        '#00FFFFFF', // 6th color should be dropped
      ]
      
      // The function enforces the limit (max 5 colors)
      saveRecentColors(colors)

      const stored = JSON.parse(localStorageMock.store['collabcanvas_recent_colors'] || '[]')
      expect(stored).toEqual(colors.slice(0, 5)) // Only first 5 are saved
    })
  })

  describe('Integration with localStorage', () => {
    it('should persist colors across load/save cycles', () => {
      const colors1 = ['#FF0000FF']
      saveRecentColors(colors1)
      expect(loadRecentColors()).toEqual(colors1)

      const colors2 = ['#FF0000FF', '#00FF00FF']
      saveRecentColors(colors2)
      expect(loadRecentColors()).toEqual(colors2)

      const colors3 = ['#FF0000FF', '#00FF00FF', '#0000FFFF']
      saveRecentColors(colors3)
      expect(loadRecentColors()).toEqual(colors3)
    })

    it('should handle rapid save operations', () => {
      for (let i = 0; i < 10; i++) {
        saveRecentColors([`#${i}${i}${i}${i}${i}${i}FF`])
      }

      const loaded = loadRecentColors()
      expect(loaded).toEqual(['#999999FF'])
    })
  })
})


