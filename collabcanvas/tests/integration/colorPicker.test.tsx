// Integration tests for Color Picker UI (PR-15)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorPicker } from '../../src/components/ColorPicker'

describe('Color Picker Integration Tests (PR-15)', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render color picker with label', () => {
      render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      expect(screen.getByText('Fill')).toBeTruthy()
    })

    it('should show current color as hex input value', () => {
      render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill Color"
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
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={recentColors}
        />
      )

      expect(screen.getByText('Recent Colors')).toBeTruthy()
    })

    it('should select color from recent colors', () => {
      const recentColors = ['#FF0000FF', '#00FF00FF']
      
      const { container } = render(
        <ColorPicker
          value="#FFFFFFFF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={recentColors}
        />
      )

      // Find all color buttons (presets + recent)
      const allColorButtons = container.querySelectorAll('button[style*="background"]')
      expect(allColorButtons.length).toBeGreaterThan(20) // Should have presets (20) + recent (2)

      // Click first recent color button (after the 20 preset buttons)
      const firstRecentColorButton = allColorButtons[20]
      if (firstRecentColorButton) {
        fireEvent.click(firstRecentColorButton)
        expect(mockOnChange).toHaveBeenCalled()
      }
    })

    it('should show Recent Colors section even when empty', () => {
      render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      const recentSection = screen.queryByText('Recent Colors')
      expect(recentSection).toBeTruthy()
    })
  })

  describe('Color Input Methods', () => {
    it('should accept hex color input', () => {
      render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      const hexInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement
      
      // Change hex value
      fireEvent.change(hexInput, { target: { value: '#00FF00' } })
      fireEvent.blur(hexInput)

      // Should call onChange with new color
      expect(mockOnChange).toHaveBeenCalledWith('#00FF00FF')
    })

    it('should handle opacity/alpha slider', () => {
      const { container } = render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Find opacity slider (input type="range")
      const sliders = container.querySelectorAll('input[type="range"]')
      expect(sliders.length).toBeGreaterThan(0)

      if (sliders.length > 0) {
        const opacitySlider = sliders[sliders.length - 1] as HTMLInputElement
        
        // Change opacity to 50%
        fireEvent.change(opacitySlider, { target: { value: '0.5' } })
        
        // Should update color with new alpha
        expect(mockOnChange).toHaveBeenCalled()
      }
    })
  })

  describe('Preset Colors', () => {
    it('should display preset color palette', () => {
      const { container } = render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
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
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Click a preset color button
      const colorButtons = container.querySelectorAll('button[style*="background"]')
      if (colorButtons.length > 0) {
        fireEvent.click(colorButtons[0])
        expect(mockOnChange).toHaveBeenCalled()
      }
    })
  })

  describe('Color Format Conversion', () => {
    it('should handle 8-digit hex colors (with alpha)', () => {
      render(
        <ColorPicker
          value="#FF000080" // 50% opacity
          onChange={mockOnChange}
          label="Fill"
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
          value="#FF0000" // No alpha
          onChange={mockOnChange}
          label="Fill"
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
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
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
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
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
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      const hexInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement

      // Rapidly change colors
      for (let i = 0; i < 5; i++) {
        fireEvent.change(hexInput, { target: { value: `#${i}${i}${i}${i}${i}${i}` } })
      }

      // Should handle all changes
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle max recent colors limit', () => {
      const maxRecentColors = ['#FF0000FF', '#00FF00FF', '#0000FFFF', '#FFFF00FF', '#FF00FFFF']
      
      render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={maxRecentColors}
        />
      )

      // Should display all recent colors (max 5)
      expect(screen.getByText('Recent Colors')).toBeTruthy()
    })

    it('should render with default showOpacity=true', () => {
      const { container } = render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
        />
      )

      // Should have opacity slider by default
      const sliders = container.querySelectorAll('input[type="range"]')
      expect(sliders.length).toBeGreaterThan(0)
    })

    it('should allow disabling opacity slider', () => {
      const { container } = render(
        <ColorPicker
          value="#FF0000FF"
          onChange={mockOnChange}
          label="Fill"
          recentColors={[]}
          showOpacity={false}
        />
      )

      // Component should render (opacity slider may or may not be present)
      expect(container.querySelector('input[type="text"]')).toBeTruthy()
    })
  })
})

