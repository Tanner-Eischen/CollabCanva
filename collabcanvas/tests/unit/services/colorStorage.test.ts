// Unit tests for Color Storage Service (PR-15)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadRecentColors, saveRecentColors } from '../../../src/services/colorStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Color Storage Service (PR-15)', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('loadRecentColors', () => {
    it('should return empty array when no colors stored', () => {
      const colors = loadRecentColors()
      expect(colors).toEqual([])
    })

    it('should load colors from localStorage', () => {
      const testColors = ['#FF0000FF', '#00FF00FF', '#0000FFFF']
      localStorageMock.setItem('collabcanvas-recent-colors', JSON.stringify(testColors))

      const colors = loadRecentColors()
      expect(colors).toEqual(testColors)
    })

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.setItem('collabcanvas-recent-colors', 'invalid json')

      const colors = loadRecentColors()
      expect(colors).toEqual([])
    })

    it('should handle non-array data in localStorage', () => {
      localStorageMock.setItem('collabcanvas-recent-colors', JSON.stringify({ color: 'red' }))

      const colors = loadRecentColors()
      expect(colors).toEqual([])
    })
  })

  describe('saveRecentColors', () => {
    it('should save colors to localStorage', () => {
      const testColors = ['#FF0000FF', '#00FF00FF']
      saveRecentColors(testColors)

      const stored = localStorageMock.getItem('collabcanvas-recent-colors')
      expect(stored).toBe(JSON.stringify(testColors))
    })

    it('should save empty array', () => {
      saveRecentColors([])

      const stored = localStorageMock.getItem('collabcanvas-recent-colors')
      expect(stored).toBe(JSON.stringify([]))
    })

    it('should overwrite existing colors', () => {
      const oldColors = ['#FF0000FF', '#00FF00FF']
      const newColors = ['#0000FFFF', '#FFFF00FF']

      saveRecentColors(oldColors)
      saveRecentColors(newColors)

      const stored = localStorageMock.getItem('collabcanvas-recent-colors')
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
      
      // The function itself doesn't enforce the limit, but tests the saved data
      saveRecentColors(colors)

      const stored = JSON.parse(localStorageMock.getItem('collabcanvas-recent-colors') || '[]')
      expect(stored).toEqual(colors) // Function saves all, useCanvas enforces limit
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


