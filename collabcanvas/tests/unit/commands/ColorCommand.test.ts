// Unit tests for ColorCommand (PR-15)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ColorCommand } from '../../../src/commands/ColorCommand'

describe('ColorCommand (PR-15)', () => {
  let updateShapeMock: ReturnType<typeof vi.fn>
  let syncColorMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    updateShapeMock = vi.fn()
    syncColorMock = vi.fn().mockResolvedValue(undefined)
  })

  describe('Single Shape Color Change', () => {
    it('should execute color change for single shape', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }],
      ])

      const command = new ColorCommand(
        ['shape1'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()

      expect(updateShapeMock).toHaveBeenCalledWith('shape1', { fill: '#0000FFFF' })
      expect(syncColorMock).toHaveBeenCalledWith('shape1', '#0000FFFF', undefined, undefined)
    })

    it('should undo color change', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }],
      ])

      const command = new ColorCommand(
        ['shape1'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()
      command.undo()

      expect(updateShapeMock).toHaveBeenCalledWith('shape1', { fill: '#FF0000FF' })
      expect(syncColorMock).toHaveBeenCalledWith('shape1', '#FF0000FF', undefined, undefined)
    })

    it('should redo color change', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }],
      ])

      const command = new ColorCommand(
        ['shape1'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()
      command.undo()
      command.redo()

      // Should be called 3 times total: execute, undo, redo
      expect(updateShapeMock).toHaveBeenCalledTimes(3)
      // Last call should be the new color
      expect(updateShapeMock).toHaveBeenLastCalledWith('shape1', { fill: '#0000FFFF' })
    })
  })

  describe('Multi-Shape Color Change', () => {
    it('should execute color change for multiple shapes', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }],
        ['shape2', { fill: '#00FF00FF', stroke: undefined, strokeWidth: undefined }],
        ['shape3', { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#FFFFFFFF', stroke: undefined, strokeWidth: undefined }],
        ['shape2', { fill: '#FFFFFFFF', stroke: undefined, strokeWidth: undefined }],
        ['shape3', { fill: '#FFFFFFFF', stroke: undefined, strokeWidth: undefined }],
      ])

      const command = new ColorCommand(
        ['shape1', 'shape2', 'shape3'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()

      expect(updateShapeMock).toHaveBeenCalledTimes(3)
      expect(syncColorMock).toHaveBeenCalledTimes(3)
    })

    it('should undo multi-shape color change with different original colors', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }],
        ['shape2', { fill: '#00FF00FF', stroke: undefined, strokeWidth: undefined }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#FFFFFFFF', stroke: undefined, strokeWidth: undefined }],
        ['shape2', { fill: '#FFFFFFFF', stroke: undefined, strokeWidth: undefined }],
      ])

      const command = new ColorCommand(
        ['shape1', 'shape2'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()
      command.undo()

      // Each shape should be restored to its original color
      expect(updateShapeMock).toHaveBeenCalledWith('shape1', { fill: '#FF0000FF' })
      expect(updateShapeMock).toHaveBeenCalledWith('shape2', { fill: '#00FF00FF' })
    })
  })

  describe('Stroke Properties', () => {
    it('should handle stroke color changes', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 2 }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: '#FFFFFFFF', strokeWidth: 2 }],
      ])

      const command = new ColorCommand(
        ['shape1'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()

      expect(updateShapeMock).toHaveBeenCalledWith('shape1', {
        stroke: '#FFFFFFFF',
        strokeWidth: 2,
      })
      expect(syncColorMock).toHaveBeenCalledWith('shape1', undefined, '#FFFFFFFF', 2)
    })

    it('should handle stroke width changes', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 2 }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 5 }],
      ])

      const command = new ColorCommand(
        ['shape1'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()

      expect(updateShapeMock).toHaveBeenCalledWith('shape1', {
        stroke: '#000000FF',
        strokeWidth: 5,
      })
    })

    it('should handle fill and stroke changes together', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 2 }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#0000FFFF', stroke: '#FFFFFFFF', strokeWidth: 4 }],
      ])

      const command = new ColorCommand(
        ['shape1'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()

      expect(updateShapeMock).toHaveBeenCalledWith('shape1', {
        fill: '#0000FFFF',
        stroke: '#FFFFFFFF',
        strokeWidth: 4,
      })
      expect(syncColorMock).toHaveBeenCalledWith('shape1', '#0000FFFF', '#FFFFFFFF', 4)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty shape list', () => {
      const command = new ColorCommand(
        [],
        new Map(),
        new Map(),
        updateShapeMock,
        syncColorMock
      )

      command.execute()

      expect(updateShapeMock).not.toHaveBeenCalled()
      expect(syncColorMock).not.toHaveBeenCalled()
    })

    it('should handle shapes with missing color data', () => {
      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }],
      ])
      const newColors = new Map([
        // shape2 missing in new colors
      ])

      const command = new ColorCommand(
        ['shape1', 'shape2'],
        oldColors,
        newColors,
        updateShapeMock,
        syncColorMock
      )

      command.execute()

      // Should only update shape1
      expect(updateShapeMock).toHaveBeenCalledTimes(1)
      expect(updateShapeMock).toHaveBeenCalledWith('shape1', { fill: '#FF0000FF' })
    })

    it('should handle sync failures gracefully', async () => {
      const syncFailMock = vi.fn().mockRejectedValue(new Error('Sync failed'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const oldColors = new Map([
        ['shape1', { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }],
      ])
      const newColors = new Map([
        ['shape1', { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }],
      ])

      const command = new ColorCommand(
        ['shape1'],
        oldColors,
        newColors,
        updateShapeMock,
        syncFailMock
      )

      command.execute()

      // updateShape should still be called
      expect(updateShapeMock).toHaveBeenCalledWith('shape1', { fill: '#0000FFFF' })
      
      // Wait for promise rejection
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should not throw, just log error
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Command Type', () => {
    it('should have correct command type', () => {
      const command = new ColorCommand(
        [],
        new Map(),
        new Map(),
        updateShapeMock,
        syncColorMock
      )

      expect(command.type).toBe('color')
    })
  })
})


