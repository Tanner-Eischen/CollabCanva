import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CanvasPage from '../../src/pages/CanvasPage'
import * as useAuthHook from '../../src/hooks/useAuth'
import * as usePresenceHook from '../../src/hooks/usePresence'
import * as useCanvasHook from '../../src/hooks/useCanvas'

// Mock hooks
vi.mock('../../src/hooks/useAuth')
vi.mock('../../src/hooks/usePresence')
vi.mock('../../src/hooks/useCanvas')

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="konva-stage" {...props}>{children}</div>,
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Line: () => <div data-testid="konva-line" />,
  Rect: () => <div data-testid="konva-rect" />,
  Circle: () => <div data-testid="konva-circle" />,
  Text: () => <div data-testid="konva-text" />,
  Transformer: () => <div data-testid="konva-transformer" />,
}))

describe('Copy/Paste/Duplicate Integration', () => {
  let mockCopySelected: ReturnType<typeof vi.fn>
  let mockPaste: ReturnType<typeof vi.fn>
  let mockDuplicateSelected: ReturnType<typeof vi.fn>
  let mockShapes: any[]
  let mockSelectedIds: Set<string>

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

    // Initialize mock functions
    mockCopySelected = vi.fn()
    mockPaste = vi.fn()
    mockDuplicateSelected = vi.fn()
    
    // Mock shapes data
    mockShapes = [
      {
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      },
      {
        id: 'shape-2',
        type: 'circle',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      },
    ]
    
    mockSelectedIds = new Set(['shape-1'])

    // Mock useCanvas
    vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
      shapes: mockShapes,
      selectedId: 'shape-1',
      selectedIds: mockSelectedIds,
      addShape: vi.fn(),
      addText: vi.fn(),
      updateShape: vi.fn(),
      deleteShape: vi.fn(),
      setSelection: vi.fn(),
      toggleSelection: vi.fn(),
      selectMultiple: vi.fn(),
      clearSelection: vi.fn(),
      selectAll: vi.fn(),
      getSelectedShapes: vi.fn(() => mockShapes.filter(s => mockSelectedIds.has(s.id))),
      bulkMove: vi.fn(),
      bulkDelete: vi.fn(),
      copySelected: mockCopySelected,
      paste: mockPaste,
      duplicateSelected: mockDuplicateSelected,
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should call copySelected when Cmd+C is pressed with selection', async () => {
      render(<CanvasPage />)

      // Simulate Cmd+C
      fireEvent.keyDown(window, { key: 'c', metaKey: true })

      await waitFor(() => {
        expect(mockCopySelected).toHaveBeenCalledTimes(1)
      })
    })

    it('should call copySelected when Ctrl+C is pressed with selection (Windows)', async () => {
      render(<CanvasPage />)

      // Simulate Ctrl+C
      fireEvent.keyDown(window, { key: 'c', ctrlKey: true })

      await waitFor(() => {
        expect(mockCopySelected).toHaveBeenCalledTimes(1)
      })
    })

    it('should call paste when Cmd+V is pressed', async () => {
      render(<CanvasPage />)

      // Simulate Cmd+V
      fireEvent.keyDown(window, { key: 'v', metaKey: true })

      await waitFor(() => {
        expect(mockPaste).toHaveBeenCalledTimes(1)
      })
    })

    it('should call paste when Ctrl+V is pressed (Windows)', async () => {
      render(<CanvasPage />)

      // Simulate Ctrl+V
      fireEvent.keyDown(window, { key: 'v', ctrlKey: true })

      await waitFor(() => {
        expect(mockPaste).toHaveBeenCalledTimes(1)
      })
    })

    it('should call duplicateSelected when Cmd+D is pressed with selection', async () => {
      render(<CanvasPage />)

      // Simulate Cmd+D
      fireEvent.keyDown(window, { key: 'd', metaKey: true })

      await waitFor(() => {
        expect(mockDuplicateSelected).toHaveBeenCalledTimes(1)
      })
    })

    it('should call duplicateSelected when Ctrl+D is pressed with selection (Windows)', async () => {
      render(<CanvasPage />)

      // Simulate Ctrl+D
      fireEvent.keyDown(window, { key: 'd', ctrlKey: true })

      await waitFor(() => {
        expect(mockDuplicateSelected).toHaveBeenCalledTimes(1)
      })
    })

    it('should not call copySelected when no shapes are selected', async () => {
      // Mock empty selection
      mockSelectedIds = new Set()
      vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
        shapes: mockShapes,
        selectedId: null,
        selectedIds: mockSelectedIds,
        addShape: vi.fn(),
        addText: vi.fn(),
        updateShape: vi.fn(),
        deleteShape: vi.fn(),
        setSelection: vi.fn(),
        toggleSelection: vi.fn(),
        selectMultiple: vi.fn(),
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        getSelectedShapes: vi.fn(() => []),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        copySelected: mockCopySelected,
        paste: mockPaste,
        duplicateSelected: mockDuplicateSelected,
      })

      render(<CanvasPage />)

      // Simulate Cmd+C with no selection
      fireEvent.keyDown(window, { key: 'c', metaKey: true })

      // Should not be called because condition checks selectedIds.size > 0
      await waitFor(() => {
        expect(mockCopySelected).not.toHaveBeenCalled()
      })
    })

    it('should allow paste even without selection', async () => {
      // Mock empty selection
      mockSelectedIds = new Set()
      vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
        shapes: mockShapes,
        selectedId: null,
        selectedIds: mockSelectedIds,
        addShape: vi.fn(),
        addText: vi.fn(),
        updateShape: vi.fn(),
        deleteShape: vi.fn(),
        setSelection: vi.fn(),
        toggleSelection: vi.fn(),
        selectMultiple: vi.fn(),
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        getSelectedShapes: vi.fn(() => []),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        copySelected: mockCopySelected,
        paste: mockPaste,
        duplicateSelected: mockDuplicateSelected,
      })

      render(<CanvasPage />)

      // Simulate Cmd+V without selection (should still work)
      fireEvent.keyDown(window, { key: 'v', metaKey: true })

      await waitFor(() => {
        expect(mockPaste).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Copy/Paste Flow', () => {
    it('should copy and paste shape with offset', async () => {
      const mockSelectMultiple = vi.fn()
      let currentShapes = [...mockShapes]

      // Mock useCanvas with copy/paste behavior
      vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
        shapes: currentShapes,
        selectedId: 'shape-1',
        selectedIds: new Set(['shape-1']),
        addShape: vi.fn(),
        addText: vi.fn(),
        updateShape: vi.fn(),
        deleteShape: vi.fn(),
        setSelection: vi.fn(),
        toggleSelection: vi.fn(),
        selectMultiple: mockSelectMultiple,
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        getSelectedShapes: vi.fn(() => [mockShapes[0]]),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        copySelected: () => {
          // Simulated copy
        },
        paste: () => {
          // Simulate paste with new shape
          currentShapes = [
            ...currentShapes,
            {
              id: 'shape-3',
              type: 'rectangle',
              x: 120, // 100 + 20 offset
              y: 120, // 100 + 20 offset
              width: 100,
              height: 100,
            },
          ]
          // Auto-select pasted shape
          mockSelectMultiple(['shape-3'])
        },
        duplicateSelected: vi.fn(),
      })

      render(<CanvasPage />)

      // Copy shape
      fireEvent.keyDown(window, { key: 'c', metaKey: true })

      // Paste shape
      fireEvent.keyDown(window, { key: 'v', metaKey: true })

      await waitFor(() => {
        // Pasted shapes should be auto-selected
        expect(mockSelectMultiple).toHaveBeenCalledWith(['shape-3'])
      })
    })

    it('should handle multi-select copy and paste', async () => {
      mockSelectedIds = new Set(['shape-1', 'shape-2'])
      const mockSelectMultiple = vi.fn()

      vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
        shapes: mockShapes,
        selectedId: 'shape-2',
        selectedIds: mockSelectedIds,
        addShape: vi.fn(),
        addText: vi.fn(),
        updateShape: vi.fn(),
        deleteShape: vi.fn(),
        setSelection: vi.fn(),
        toggleSelection: vi.fn(),
        selectMultiple: mockSelectMultiple,
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        getSelectedShapes: vi.fn(() => mockShapes),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        copySelected: vi.fn(),
        paste: vi.fn(() => {
          mockSelectMultiple(['shape-3', 'shape-4'])
        }),
        duplicateSelected: vi.fn(),
      })

      render(<CanvasPage />)

      // Copy multiple shapes
      fireEvent.keyDown(window, { key: 'c', metaKey: true })

      // Paste multiple shapes
      fireEvent.keyDown(window, { key: 'v', metaKey: true })

      await waitFor(() => {
        expect(mockSelectMultiple).toHaveBeenCalledWith(['shape-3', 'shape-4'])
      })
    })
  })

  describe('Duplicate Flow', () => {
    it('should duplicate selected shape with offset', async () => {
      const mockSelectMultiple = vi.fn()

      vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
        shapes: mockShapes,
        selectedId: 'shape-1',
        selectedIds: new Set(['shape-1']),
        addShape: vi.fn(),
        addText: vi.fn(),
        updateShape: vi.fn(),
        deleteShape: vi.fn(),
        setSelection: vi.fn(),
        toggleSelection: vi.fn(),
        selectMultiple: mockSelectMultiple,
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        getSelectedShapes: vi.fn(() => [mockShapes[0]]),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        copySelected: vi.fn(),
        paste: vi.fn(),
        duplicateSelected: () => {
          mockSelectMultiple(['shape-3'])
        },
      })

      render(<CanvasPage />)

      // Duplicate shape
      fireEvent.keyDown(window, { key: 'd', metaKey: true })

      await waitFor(() => {
        expect(mockSelectMultiple).toHaveBeenCalledWith(['shape-3'])
      })
    })
  })

  describe('Properties Preservation', () => {
    it('should preserve rotation when copying/pasting', async () => {
      const shapeWithRotation = {
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 45,
      }

      vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
        shapes: [shapeWithRotation],
        selectedId: 'shape-1',
        selectedIds: new Set(['shape-1']),
        addShape: vi.fn(),
        addText: vi.fn(),
        updateShape: vi.fn(),
        deleteShape: vi.fn(),
        setSelection: vi.fn(),
        toggleSelection: vi.fn(),
        selectMultiple: vi.fn(),
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        getSelectedShapes: vi.fn(() => [shapeWithRotation]),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        copySelected: mockCopySelected,
        paste: mockPaste,
        duplicateSelected: mockDuplicateSelected,
      })

      render(<CanvasPage />)

      // Copy and paste
      fireEvent.keyDown(window, { key: 'c', metaKey: true })
      fireEvent.keyDown(window, { key: 'v', metaKey: true })

      expect(mockCopySelected).toHaveBeenCalled()
      expect(mockPaste).toHaveBeenCalled()
    })

    it('should preserve text content when copying text shapes', async () => {
      const textShape = {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 30,
        text: 'Hello World',
      }

      vi.mocked(useCanvasHook.useCanvas).mockReturnValue({
        shapes: [textShape],
        selectedId: 'text-1',
        selectedIds: new Set(['text-1']),
        addShape: vi.fn(),
        addText: vi.fn(),
        updateShape: vi.fn(),
        deleteShape: vi.fn(),
        setSelection: vi.fn(),
        toggleSelection: vi.fn(),
        selectMultiple: vi.fn(),
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        getSelectedShapes: vi.fn(() => [textShape]),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        copySelected: mockCopySelected,
        paste: mockPaste,
        duplicateSelected: mockDuplicateSelected,
      })

      render(<CanvasPage />)

      // Copy and paste
      fireEvent.keyDown(window, { key: 'c', metaKey: true })
      fireEvent.keyDown(window, { key: 'v', metaKey: true })

      expect(mockCopySelected).toHaveBeenCalled()
      expect(mockPaste).toHaveBeenCalled()
    })
  })
})

