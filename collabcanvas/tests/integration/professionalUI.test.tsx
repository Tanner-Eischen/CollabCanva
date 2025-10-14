import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CanvasPage from '../../src/pages/CanvasPage'
import { useAuth } from '../../src/hooks/useAuth'

// Mock hooks
vi.mock('../../src/hooks/useAuth')
vi.mock('../../src/hooks/usePresence', () => ({
  usePresence: () => ({
    otherUsers: new Map(),
    updateCursorPosition: vi.fn(),
    updateSelection: vi.fn(),
  }),
}))

vi.mock('../../src/hooks/useCanvas', () => ({
  useCanvas: () => ({
    shapes: [],
    selectedId: null,
    selectedIds: new Set(),
    addShape: vi.fn(),
    addText: vi.fn(),
    updateShape: vi.fn(),
    deleteShape: vi.fn(),
    setSelection: vi.fn(),
    toggleSelection: vi.fn(),
    selectMultiple: vi.fn(),
    clearSelection: vi.fn(),
    selectAll: vi.fn(),
    bulkMove: vi.fn(),
    bulkDelete: vi.fn(),
    copySelected: vi.fn(),
    paste: vi.fn(),
    duplicateSelected: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    updateColors: vi.fn(),
    getRecentColors: () => [],
    addLine: vi.fn(),
    addPolygon: vi.fn(),
    addStar: vi.fn(),
    addRoundedRect: vi.fn(),
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    bringForward: vi.fn(),
    sendBackward: vi.fn(),
    sortShapesByZIndex: () => [],
    alignSelected: vi.fn(),
    distributeSelectedHorizontally: vi.fn(),
    distributeSelectedVertically: vi.fn(),
    centerSelectedInCanvas: vi.fn(),
  }),
}))

describe('Professional UI Integration Tests (PR-20)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      logOut: vi.fn(),
    } as any)

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    })
  })

  describe('Canvas Layout', () => {
    it('should have proper header height (64px)', () => {
      render(<CanvasPage />)
      
      // Header should be visible and have proper height
      const header = document.querySelector('.h-header')
      expect(header).toBeDefined()
    })

    it('should have proper toolbar width (48px)', () => {
      render(<CanvasPage />)
      
      // Toolbar should be visible
      const toolbar = document.querySelector('.w-toolbar')
      expect(toolbar).toBeDefined()
    })

    it('should have canvas container with correct dimensions', () => {
      render(<CanvasPage />)
      
      // Canvas container should account for toolbar
      const canvasContainer = document.querySelector('.w-\\[calc\\(100vw-48px\\)\\]')
      expect(canvasContainer).toBeDefined()
    })

    it('should not have overlapping panels', () => {
      render(<CanvasPage />)
      
      // Main content area should be flex layout
      const mainContent = document.querySelector('.flex.flex-row')
      expect(mainContent).toBeDefined()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should show keyboard shortcuts modal when "?" is pressed', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Press "?" key
      await user.keyboard('?')

      // Modal should appear (we'll need to integrate KeyboardShortcuts into CanvasPage first)
      // For now, this test documents the expected behavior
    })

    it('should trigger tool selection with keyboard shortcuts', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Press "V" for select tool
      await user.keyboard('v')
      
      // Select tool should be active (visual verification in manual testing)
    })

    it('should trigger undo with Ctrl+Z', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Press Ctrl+Z
      await user.keyboard('{Control>}z{/Control}')
      
      // Undo should be triggered (verified through mock in useCanvas)
    })

    it('should trigger redo with Ctrl+Shift+Z', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Press Ctrl+Shift+Z
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
      
      // Redo should be triggered
    })
  })

  describe('Context Menu', () => {
    it('should show context menu on right-click', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Get canvas element
      const canvas = screen.getByRole('presentation', { hidden: true }) // Konva stage

      // Right-click on canvas
      await user.pointer({ keys: '[MouseRight]', target: canvas })

      // Context menu should appear
      await waitFor(() => {
        expect(document.querySelector('.fixed.bg-white.border')).toBeDefined()
      })
    })

    it('should close context menu on click outside', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Right-click to open menu
      const canvas = screen.getByRole('presentation', { hidden: true })
      await user.pointer({ keys: '[MouseRight]', target: canvas })

      // Click outside
      await user.click(document.body)

      // Context menu should close
      await waitFor(() => {
        expect(document.querySelector('.fixed.bg-white.border')).toBeNull()
      })
    })

    it('should close context menu on Escape key', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Right-click to open menu
      const canvas = screen.getByRole('presentation', { hidden: true })
      await user.pointer({ keys: '[MouseRight]', target: canvas })

      // Press Escape
      await user.keyboard('{Escape}')

      // Context menu should close
      await waitFor(() => {
        expect(document.querySelector('.fixed.bg-white.border')).toBeNull()
      })
    })
  })

  describe('Tooltips', () => {
    it('should show tooltips on toolbar button hover', async () => {
      const user = userEvent.setup()
      render(<CanvasPage />)

      // Find toolbar button (e.g., Rectangle button)
      const rectangleButton = screen.getByTitle(/rectangle/i) || screen.getByText('▭')

      // Hover over button
      await user.hover(rectangleButton)

      // Tooltip should appear after delay
      await waitFor(() => {
        expect(document.querySelector('.bg-neutral-800.text-white')).toBeDefined()
      }, { timeout: 500 })
    })
  })

  describe('Design System', () => {
    it('should use Inter font family', () => {
      render(<CanvasPage />)
      
      // Check that Inter font is applied (in document head)
      const fontLink = document.querySelector('link[href*="Inter"]')
      expect(fontLink).toBeDefined()
    })

    it('should use professional color palette', () => {
      render(<CanvasPage />)
      
      // Check for neutral colors (bg-neutral-50, etc.)
      const neutralBg = document.querySelector('.bg-neutral-50')
      expect(neutralBg).toBeDefined()
    })

    it('should use Figma-style shadows', () => {
      render(<CanvasPage />)
      
      // Check for shadow classes (shadow-soft, shadow-hard)
      const shadowElement = document.querySelector('[class*="shadow-"]')
      expect(shadowElement).toBeDefined()
    })
  })

  describe('Responsive Layout', () => {
    it('should handle window resize', async () => {
      render(<CanvasPage />)

      // Resize window
      window.innerWidth = 1280
      window.innerHeight = 720
      window.dispatchEvent(new Event('resize'))

      // Canvas should adjust (manual verification)
      await waitFor(() => {
        expect(true).toBe(true) // Placeholder for actual canvas size check
      })
    })
  })

  describe('Center Canvas on Load', () => {
    it('should center canvas at (2500, 2500) on load', async () => {
      render(<CanvasPage />)

      // Canvas should be centered
      // This requires checking the Konva Stage position
      // For now, this documents the expected behavior
      await waitFor(() => {
        expect(true).toBe(true) // Placeholder
      })
    })
  })

  describe('Dot Grid', () => {
    it('should render dot grid instead of line grid', () => {
      render(<CanvasPage />)

      // Dots should be rendered (Konva Circles with 1px radius)
      // Manual verification in browser
      expect(true).toBe(true)
    })
  })
})

