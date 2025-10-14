// Unit tests for ColorCommand (PR-15)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ColorCommand } from '../../../src/commands/ColorCommand'

describe('ColorCommand (PR-15)', () => {
  let updateShapeInStateMock: ReturnType<typeof vi.fn>
  let syncUpdateMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    updateShapeInStateMock = vi.fn()
    syncUpdateMock = vi.fn().mockResolvedValue(undefined)
  })

  describe('Single Shape Color Change', () => {
    it('should execute color change for single shape', () => {
      const oldColors = { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }
      const newColors = { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncUpdateMock
      )

      command.execute()

      expect(updateShapeInStateMock).toHaveBeenCalledWith('shape1', newColors)
      expect(syncUpdateMock).toHaveBeenCalledWith('shape1', newColors)
    })

    it('should undo color change', () => {
      const oldColors = { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }
      const newColors = { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncUpdateMock
      )

      command.execute()
      command.undo()

      expect(updateShapeInStateMock).toHaveBeenCalledWith('shape1', oldColors)
      expect(syncUpdateMock).toHaveBeenCalledWith('shape1', oldColors)
    })

    it('should redo color change', () => {
      const oldColors = { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }
      const newColors = { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncUpdateMock
      )

      command.execute()
      command.undo()
      command.redo()

      // Should be called 3 times total: execute, undo, redo
      expect(updateShapeInStateMock).toHaveBeenCalledTimes(3)
      // Last call should be the new color
      expect(updateShapeInStateMock).toHaveBeenLastCalledWith('shape1', newColors)
    })
  })

  describe('Stroke Properties', () => {
    it('should handle stroke color changes', () => {
      const oldColors = { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 2 }
      const newColors = { fill: '#FF0000FF', stroke: '#FFFFFFFF', strokeWidth: 2 }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncUpdateMock
      )

      command.execute()

      expect(updateShapeInStateMock).toHaveBeenCalledWith('shape1', newColors)
      expect(syncUpdateMock).toHaveBeenCalledWith('shape1', newColors)
    })

    it('should handle stroke width changes', () => {
      const oldColors = { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 2 }
      const newColors = { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 5 }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncUpdateMock
      )

      command.execute()

      expect(updateShapeInStateMock).toHaveBeenCalledWith('shape1', newColors)
    })

    it('should handle fill and stroke changes together', () => {
      const oldColors = { fill: '#FF0000FF', stroke: '#000000FF', strokeWidth: 2 }
      const newColors = { fill: '#0000FFFF', stroke: '#FFFFFFFF', strokeWidth: 4 }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncUpdateMock
      )

      command.execute()

      expect(updateShapeInStateMock).toHaveBeenCalledWith('shape1', newColors)
      expect(syncUpdateMock).toHaveBeenCalledWith('shape1', newColors)
    })
  })

  describe('Edge Cases', () => {
    it('should handle sync failures gracefully', async () => {
      const syncFailMock = vi.fn().mockRejectedValue(new Error('Sync failed'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const oldColors = { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }
      const newColors = { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncFailMock
      )

      command.execute()

      // updateShapeInState should still be called
      expect(updateShapeInStateMock).toHaveBeenCalledWith('shape1', newColors)
      
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
        'shape1',
        { fill: '#FF0000FF' },
        { fill: '#0000FFFF' },
        updateShapeInStateMock,
        syncUpdateMock
      )

      expect(command.type).toBe('color')
    })
  })

  describe('Multiple Undo/Redo Cycles', () => {
    it('should handle multiple undo/redo cycles correctly', () => {
      const oldColors = { fill: '#FF0000FF', stroke: undefined, strokeWidth: undefined }
      const newColors = { fill: '#0000FFFF', stroke: undefined, strokeWidth: undefined }

      const command = new ColorCommand(
        'shape1',
        oldColors,
        newColors,
        updateShapeInStateMock,
        syncUpdateMock
      )

      // Execute
      command.execute()
      expect(updateShapeInStateMock).toHaveBeenLastCalledWith('shape1', newColors)

      // Undo
      command.undo()
      expect(updateShapeInStateMock).toHaveBeenLastCalledWith('shape1', oldColors)

      // Redo
      command.redo()
      expect(updateShapeInStateMock).toHaveBeenLastCalledWith('shape1', newColors)

      // Undo again
      command.undo()
      expect(updateShapeInStateMock).toHaveBeenLastCalledWith('shape1', oldColors)

      // Total calls: execute + undo + redo + undo = 4
      expect(updateShapeInStateMock).toHaveBeenCalledTimes(4)
    })
  })
})

