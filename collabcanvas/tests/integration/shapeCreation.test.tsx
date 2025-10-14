import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from '../../src/components/Toolbar'
import CanvasPage from '../../src/pages/CanvasPage'
import * as useAuthHook from '../../src/hooks/useAuth'
import * as usePresenceHook from '../../src/hooks/usePresence'

// Mock hooks
vi.mock('../../src/hooks/useAuth')
vi.mock('../../src/hooks/usePresence')

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="konva-stage" {...props}>{children}</div>,
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Line: () => <div data-testid="konva-line" />,
  Rect: () => <div data-testid="konva-rect" />,
  Circle: () => <div data-testid="konva-circle" />,
  Text: () => <div data-testid="konva-text" />,
}))

describe('Shape Creation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useAuth
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      },
      loading: false,
    })

    // Mock usePresence
    vi.mocked(usePresenceHook.usePresence).mockReturnValue({
      otherUsers: new Map(),
      updateCursorPosition: vi.fn(),
      updateSelection: vi.fn(),
    })
  })

  describe('Toolbar Component', () => {
    it('should render toolbar on left side with all tool buttons', () => {
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      // Check for shape tool buttons
      expect(screen.getByTitle('Rectangle')).toBeInTheDocument()
      expect(screen.getByTitle('Circle')).toBeInTheDocument()
      expect(screen.getByTitle('Text')).toBeInTheDocument()
      // Delete button may show different title based on selection state
      const deleteButton = screen.getByText('🗑')
      expect(deleteButton).toBeInTheDocument()
    })

    it('should show active state for selected tool', () => {
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      const { rerender } = render(
        <Toolbar
          selectedTool="rectangle"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      const rectButton = screen.getByTitle('Rectangle')
      expect(rectButton).toHaveClass('bg-blue-600')

      // Change selected tool
      rerender(
        <Toolbar
          selectedTool="circle"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      const circleButton = screen.getByTitle('Circle')
      expect(circleButton).toHaveClass('bg-blue-600')
    })

    it('should call onToolSelect when tool button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByTitle('Rectangle'))
      expect(mockOnToolSelect).toHaveBeenCalledWith('rectangle')

      await user.click(screen.getByTitle('Circle'))
      expect(mockOnToolSelect).toHaveBeenCalledWith('circle')

      await user.click(screen.getByTitle('Text'))
      expect(mockOnToolSelect).toHaveBeenCalledWith('text')
    })

    it('should disable delete button when no selection', () => {
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTitle(/no selection/i)
      expect(deleteButton).toBeDisabled()
      expect(deleteButton).toHaveClass('cursor-not-allowed')
    })

    it('should enable delete button when shape is selected', () => {
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={true}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTitle(/delete/i)
      expect(deleteButton).not.toBeDisabled()
      expect(deleteButton).not.toHaveClass('cursor-not-allowed')
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={true}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByTitle(/delete/i))
      expect(mockOnDelete).toHaveBeenCalled()
    })
  })

  describe('Tool Hover States', () => {
    it('should have hover states for better UX', () => {
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      const rectButton = screen.getByTitle('Rectangle')
      expect(rectButton).toHaveClass('hover:bg-gray-600')
    })
  })

  describe('Shape Creation Properties', () => {
    it('should create shapes with fixed blue color (#3B82F6)', async () => {
      // This test verifies the DEFAULT_CANVAS_CONFIG.defaultColor value
      // Shapes are rendered with this color in the shape components
      const { DEFAULT_CANVAS_CONFIG } = await import('../../src/types/canvas')
      expect(DEFAULT_CANVAS_CONFIG.defaultColor).toBe('#3B82F6')
    })

    it('should create rectangles and circles with fixed 100x100px dimensions', async () => {
      const { DEFAULT_CANVAS_CONFIG } = await import('../../src/types/canvas')
      expect(DEFAULT_CANVAS_CONFIG.defaultShapeSize).toBe(100)
    })
  })

  describe('Tool Selection Flow', () => {
    it('should allow switching between tools', async () => {
      const user = userEvent.setup()
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      // Select rectangle
      await user.click(screen.getByTitle('Rectangle'))
      expect(mockOnToolSelect).toHaveBeenCalledWith('rectangle')

      // Select circle
      await user.click(screen.getByTitle('Circle'))
      expect(mockOnToolSelect).toHaveBeenCalledWith('circle')

      // Select text
      await user.click(screen.getByTitle('Text'))
      expect(mockOnToolSelect).toHaveBeenCalledWith('text')
    })
  })

  describe('Vertical Layout', () => {
    it('should have vertical layout with fixed width', () => {
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      const { container } = render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      const toolbar = container.firstChild as HTMLElement
      expect(toolbar).toHaveClass('w-20') // 80px width
      expect(toolbar).toHaveClass('flex-col') // Vertical layout
    })

    it('should have delete button separated by spacer', () => {
      const mockOnToolSelect = vi.fn()
      const mockOnDelete = vi.fn()

      const { container } = render(
        <Toolbar
          selectedTool="select"
          onToolSelect={mockOnToolSelect}
          hasSelection={false}
          onDelete={mockOnDelete}
        />
      )

      const toolbar = container.firstChild as HTMLElement
      const spacer = toolbar.querySelector('.flex-1')
      expect(spacer).toBeInTheDocument()
    })
  })
})

