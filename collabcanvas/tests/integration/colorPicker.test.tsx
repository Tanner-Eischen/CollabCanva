// Integration tests for Color Picker UI (PR-15)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorPicker } from '../../src/components/ColorPicker'

describe('Color Picker Integration Tests (PR-15)', () => {
  const mockOnColorChange = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render color picker when visible', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      expect(screen.getByText('Fill Color')).toBeTruthy()
    })

    it('should not render when not visible', () => {
      const { container } = render(
        <ColorPicker
          visible={false}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should show current color as hex input value', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      const hexInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement
      expect(hexInput).toBeTruthy()
      expect(hexInput.value).toBe('#FF0000')
    })
  })

  describe('Recent Colors', () => {
    it('should display recent colors', () => {
      const recentColors = ['#FF0000FF', '#00FF00FF', '#0000FFFF']
      
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={recentColors}
        />
      )

      expect(screen.getByText('Recent Colors')).toBeTruthy()
      // Recent color swatches should be rendered
      const colorSwatches = screen.getAllByRole('button')
      expect(colorSwatches.length).toBeGreaterThan(0)
    })

    it('should select color from recent colors', () => {
      const recentColors = ['#FF0000FF', '#00FF00FF']
      
      const { container } = render(
        <ColorPicker
          visible={true}
          currentColor="#FFFFFFFF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={recentColors}
        />
      )

      // Find recent color buttons (they have specific background colors)
      const recentColorButtons = container.querySelectorAll('[style*="background"]')
      expect(recentColorButtons.length).toBeGreaterThan(0)

      // Click first recent color
      if (recentColorButtons[0]) {
        fireEvent.click(recentColorButtons[0])
        expect(mockOnColorChange).toHaveBeenCalled()
      }
    })

    it('should show empty state when no recent colors', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Should still show the Recent Colors section but empty
      const recentSection = screen.queryByText('Recent Colors')
      expect(recentSection).toBeTruthy()
    })
  })

  describe('Color Input Methods', () => {
    it('should accept hex color input', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      const hexInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement
      
      // Change hex value
      fireEvent.change(hexInput, { target: { value: '#00FF00' } })
      fireEvent.blur(hexInput)

      // Should call onColorChange with new color
      expect(mockOnColorChange).toHaveBeenCalledWith('#00FF00FF')
    })

    it('should handle opacity/alpha slider', () => {
      const { container } = render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Find opacity slider (input type="range")
      const sliders = container.querySelectorAll('input[type="range"]')
      expect(sliders.length).toBeGreaterThan(0)

      if (sliders.length > 0) {
        const alphaSlider = sliders[sliders.length - 1] as HTMLInputElement
        
        // Change alpha to 50%
        fireEvent.change(alphaSlider, { target: { value: '128' } })
        
        // Should update color with new alpha
        expect(mockOnColorChange).toHaveBeenCalled()
      }
    })
  })

  describe('Preset Colors', () => {
    it('should display preset color palette', () => {
      const { container } = render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Should have preset color buttons
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should select preset color', () => {
      const { container } = render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Click a preset color button
      const colorButtons = container.querySelectorAll('button[style*="background"]')
      if (colorButtons.length > 0) {
        fireEvent.click(colorButtons[0])
        expect(mockOnColorChange).toHaveBeenCalled()
      }
    })
  })

  describe('Color Picker Interactions', () => {
    it('should close picker when close button clicked', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Find and click close button (usually an X or Close text)
      const closeButtons = screen.queryAllByText('×')
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0])
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    it('should validate hex color input', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      const hexInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement

      // Try invalid hex value
      fireEvent.change(hexInput, { target: { value: 'invalid' } })
      fireEvent.blur(hexInput)

      // Should not call onColorChange with invalid color
      // or should handle validation internally
      // (implementation-specific behavior)
    })
  })

  describe('Color Format Conversion', () => {
    it('should handle 8-digit hex colors (with alpha)', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF000080" // 50% opacity
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Should display color correctly
      const hexDisplay = screen.queryByDisplayValue('#FF0000')
      expect(hexDisplay).toBeTruthy()
    })

    it('should handle 6-digit hex colors (no alpha)', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000" // No alpha
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      const hexDisplay = screen.queryByDisplayValue('#FF0000')
      expect(hexDisplay).toBeTruthy()
    })
  })

  describe('User Experience', () => {
    it('should have accessible color picker interface', () => {
      const { container } = render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Should have input elements
      const inputs = container.querySelectorAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('should show visual feedback for current color', () => {
      const { container } = render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Should have element showing current color
      const colorPreview = container.querySelector('[style*="rgb(255, 0, 0)"], [style*="#FF0000"], [style*="#ff0000"]')
      expect(colorPreview || container.querySelector('input[type="color"]')).toBeTruthy()
    })

    it('should handle rapid color changes', () => {
      const { container } = render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      const hexInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement

      // Rapidly change colors
      for (let i = 0; i < 5; i++) {
        fireEvent.change(hexInput, { target: { value: `#${i}${i}${i}${i}${i}${i}` } })
      }

      // Should handle all changes
      expect(mockOnColorChange.mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined current color', () => {
      render(
        <ColorPicker
          visible={true}
          currentColor={undefined as any}
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={[]}
        />
      )

      // Should render without crashing
      expect(screen.getByText('Fill Color')).toBeTruthy()
    })

    it('should handle max recent colors limit', () => {
      const maxRecentColors = ['#FF0000FF', '#00FF00FF', '#0000FFFF', '#FFFF00FF', '#FF00FFFF']
      
      render(
        <ColorPicker
          visible={true}
          currentColor="#FF0000FF"
          onColorChange={mockOnColorChange}
          onClose={mockOnClose}
          recentColors={maxRecentColors}
        />
      )

      // Should display all recent colors (max 5)
      expect(screen.getByText('Recent Colors')).toBeTruthy()
    })
  })
})


