import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ColorPicker } from '../../src/components/ColorPicker'

/**
 * Integration Tests for Enhanced ColorPicker (PR-24)
 * Tests expanded palette, eyedropper functionality, and canvas sampling
 */

describe('Enhanced ColorPicker Integration Tests', () => {
  const mockOnChange = vi.fn()
  const mockOnRequestCanvasSample = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnRequestCanvasSample.mockClear()
  })

  describe('Expanded Color Palette', () => {
    it('displays 80+ preset colors', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Count color buttons in the preset section
      const presetButtons = container.querySelectorAll('button[title]')
      expect(presetButtons.length).toBeGreaterThanOrEqual(80)
    })

    it('selects color from expanded palette', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Find and click the first red color (Red 100)
      const redButton = Array.from(
        container.querySelectorAll('button[title]')
      ).find((btn) => btn.getAttribute('title')?.includes('Red'))

      expect(redButton).toBeTruthy()
      fireEvent.click(redButton!)

      expect(mockOnChange).toHaveBeenCalled()
      const calledColor = mockOnChange.mock.calls[0][0]
      expect(calledColor).toMatch(/^#[0-9A-F]{8}$/) // Valid RGBA hex
    })

    it('scrolls through color palette', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Find the scrollable container
      const scrollContainer = container.querySelector('.overflow-y-auto')
      expect(scrollContainer).toBeTruthy()
      expect(scrollContainer).toHaveClass('max-h-60')
    })

    it('shows color tooltips on hover', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Check that buttons have title attributes for tooltips
      const whiteButton = Array.from(
        container.querySelectorAll('button[title]')
      ).find((btn) => btn.getAttribute('title') === 'White')

      expect(whiteButton).toBeTruthy()
      expect(whiteButton?.getAttribute('title')).toBe('White')
    })
  })

  describe('Eyedropper Tool', () => {
    it('renders eyedropper button', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
          onRequestCanvasSample={mockOnRequestCanvasSample}
        />
      )

      // Find the eyedropper button (has SVG with path)
      const eyedropperButton = container.querySelector('button svg')
      expect(eyedropperButton).toBeTruthy()
    })

    it('calls eyedropper when supported', async () => {
      // Mock EyeDropper API
      const mockEyeDropper = {
        open: vi.fn().mockResolvedValue({ sRGBHex: '#FF0000' }),
      }
      window.EyeDropper = vi.fn(() => mockEyeDropper) as any

      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Click eyedropper button
      const eyedropperButton = container.querySelector('button svg')?.parentElement
      expect(eyedropperButton).toBeTruthy()
      fireEvent.click(eyedropperButton!)

      await waitFor(() => {
        expect(mockEyeDropper.open).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('#FF0000FF')
      })

      // Clean up
      delete (window as any).EyeDropper
    })

    it('falls back to canvas sampler if no API', () => {
      // Ensure EyeDropper API is not available
      delete (window as any).EyeDropper

      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
          onRequestCanvasSample={mockOnRequestCanvasSample}
        />
      )

      // Click eyedropper button
      const eyedropperButton = container.querySelector('button svg')?.parentElement
      expect(eyedropperButton).toBeTruthy()
      fireEvent.click(eyedropperButton!)

      // Should call fallback
      expect(mockOnRequestCanvasSample).toHaveBeenCalled()
    })

    it('preserves opacity when picking colors', async () => {
      // Mock EyeDropper API
      const mockEyeDropper = {
        open: vi.fn().mockResolvedValue({ sRGBHex: '#FF0000' }),
      }
      window.EyeDropper = vi.fn(() => mockEyeDropper) as any

      const { container } = render(
        <ColorPicker
          value="#3B82F680" // 50% opacity
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Click eyedropper button
      const eyedropperButton = container.querySelector('button svg')?.parentElement
      fireEvent.click(eyedropperButton!)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })

      // Should preserve opacity (80 = 50%)
      const calledColor = mockOnChange.mock.calls[0][0]
      expect(calledColor).toBe('#FF000080')

      // Clean up
      delete (window as any).EyeDropper
    })

    it('shows loading state during eyedropper', async () => {
      // Mock EyeDropper API with delay
      const mockEyeDropper = {
        open: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ sRGBHex: '#FF0000' }), 100))
        ),
      }
      window.EyeDropper = vi.fn(() => mockEyeDropper) as any

      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      const eyedropperButton = container.querySelector('button svg')?.parentElement
      fireEvent.click(eyedropperButton!)

      // Should show loading indicator
      await waitFor(() => {
        const loadingIcon = container.querySelector('button span')
        expect(loadingIcon?.textContent).toBe('⏳')
      })

      // Clean up
      delete (window as any).EyeDropper
    })
  })

  describe('Hex Input', () => {
    it('accepts valid hex color input', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      const hexInput = container.querySelector('input[type="text"]') as HTMLInputElement
      expect(hexInput).toBeTruthy()

      fireEvent.change(hexInput, { target: { value: '#FF0000' } })

      expect(mockOnChange).toHaveBeenCalled()
      const calledColor = mockOnChange.mock.calls[0][0]
      expect(calledColor).toMatch(/^#FF0000[0-9A-F]{2}$/)
    })

    it('ignores invalid hex input', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      const hexInput = container.querySelector('input[type="text"]') as HTMLInputElement

      fireEvent.change(hexInput, { target: { value: 'invalid' } })

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Opacity Slider', () => {
    it('updates opacity when slider moved', () => {
      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
          showOpacity={true}
        />
      )

      const opacitySlider = container.querySelector('input[type="range"]') as HTMLInputElement
      expect(opacitySlider).toBeTruthy()

      fireEvent.change(opacitySlider, { target: { value: '0.5' } })

      expect(mockOnChange).toHaveBeenCalled()
      const calledColor = mockOnChange.mock.calls[0][0]
      // Should end with 80 (hex for 128 = 50% of 255)
      expect(calledColor).toMatch(/80$/)
    })

    it('displays opacity percentage', () => {
      render(
        <ColorPicker
          value="#3B82F680" // 50% opacity
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
          showOpacity={true}
        />
      )

      expect(screen.getByText('50%')).toBeTruthy()
    })
  })

  describe('Recent Colors', () => {
    it('displays recent colors when provided', () => {
      const recentColors = ['#FF0000FF', '#00FF00FF', '#0000FFFF']

      const { container } = render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={recentColors}
        />
      )

      expect(screen.getByText('Recent Colors')).toBeTruthy()

      // Should have recent color buttons
      const recentSection = container.querySelectorAll('.flex.gap-1 button')
      expect(recentSection.length).toBeGreaterThanOrEqual(3)
    })

    it('shows message when no recent colors', () => {
      render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      expect(screen.getByText('No recent colors')).toBeTruthy()
    })

    it('selects color from recent colors', () => {
      const recentColors = ['#FF0000FF', '#00FF00FF']

      render(
        <ColorPicker
          value="#3B82F6FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={recentColors}
        />
      )

      // Find recent colors by title attribute
      const recentButtons = screen.queryAllByTitle('#FF0000FF')
      expect(recentButtons.length).toBeGreaterThan(0)

      fireEvent.click(recentButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith('#FF0000FF')
    })
  })
})
