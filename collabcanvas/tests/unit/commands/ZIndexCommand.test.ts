// Unit tests for ZIndexCommand (PR-17)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ZIndexCommand } from '../../../src/commands/ZIndexCommand'

describe('ZIndexCommand (PR-17)', () => {
  let updateShapeStateMock: ReturnType<typeof vi.fn>
  let syncZIndexMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    updateShapeStateMock = vi.fn()
    syncZIndexMock = vi.fn().mockResolvedValue(undefined)
  })

  describe('Single Shape Z-Index Change', () => {
    it('should execute z-index change for single shape', () => {
      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 100]])
      const newZIndices = new Map([['shape1', 200]])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 200 })
      expect(syncZIndexMock).toHaveBeenCalledWith('shape1', 200)
    })

    it('should undo z-index change', () => {
      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 100]])
      const newZIndices = new Map([['shape1', 200]])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()
      command.undo()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 100 })
      expect(syncZIndexMock).toHaveBeenCalledWith('shape1', 100)
    })

    it('should redo z-index change', () => {
      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 100]])
      const newZIndices = new Map([['shape1', 200]])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()
      command.undo()
      command.redo()

      // Should be called 3 times: execute, undo, redo
      expect(updateShapeStateMock).toHaveBeenCalledTimes(3)
      // Last call should be new z-index
      expect(updateShapeStateMock).toHaveBeenLastCalledWith('shape1', { zIndex: 200 })
    })
  })

  describe('Multi-Shape Z-Index Change', () => {
    it('should execute z-index change for multiple shapes', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3']
      const oldZIndices = new Map([
        ['shape1', 100],
        ['shape2', 150],
        ['shape3', 200],
      ])
      const newZIndices = new Map([
        ['shape1', 300],
        ['shape2', 301],
        ['shape3', 302],
      ])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledTimes(3)
      expect(syncZIndexMock).toHaveBeenCalledTimes(3)
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 300 })
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape2', { zIndex: 301 })
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape3', { zIndex: 302 })
    })

    it('should undo multi-shape z-index change preserving relative order', () => {
      const shapeIds = ['shape1', 'shape2']
      const oldZIndices = new Map([
        ['shape1', 100],
        ['shape2', 101],
      ])
      const newZIndices = new Map([
        ['shape1', 300],
        ['shape2', 301],
      ])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()
      command.undo()

      // Each shape should be restored to its original z-index
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 100 })
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape2', { zIndex: 101 })
    })
  })

  describe('Bring to Front Operation', () => {
    it('should set shapes to top of stack', () => {
      const shapeIds = ['shape2']
      const oldZIndices = new Map([['shape2', 150]])
      const newZIndices = new Map([['shape2', 301]]) // max was 300

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape2', { zIndex: 301 })
    })

    it('should maintain relative order when bringing multiple shapes to front', () => {
      const shapeIds = ['shape1', 'shape2']
      const oldZIndices = new Map([
        ['shape1', 100],
        ['shape2', 101],
      ])
      const newZIndices = new Map([
        ['shape1', 301],
        ['shape2', 302],
      ])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 301 })
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape2', { zIndex: 302 })
    })
  })

  describe('Send to Back Operation', () => {
    it('should set shapes to bottom of stack', () => {
      const shapeIds = ['shape2']
      const oldZIndices = new Map([['shape2', 150]])
      const newZIndices = new Map([['shape2', 99]]) // min was 100

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape2', { zIndex: 99 })
    })

    it('should maintain relative order when sending multiple shapes to back', () => {
      const shapeIds = ['shape3', 'shape4']
      const oldZIndices = new Map([
        ['shape3', 200],
        ['shape4', 201],
      ])
      const newZIndices = new Map([
        ['shape3', 98],
        ['shape4', 99],
      ])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape3', { zIndex: 98 })
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape4', { zIndex: 99 })
    })
  })

  describe('Bring Forward Operation', () => {
    it('should increment z-index by one level', () => {
      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 100]])
      const newZIndices = new Map([['shape1', 150]]) // swapped with shape at 150

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 150 })
    })
  })

  describe('Send Backward Operation', () => {
    it('should decrement z-index by one level', () => {
      const shapeIds = ['shape2']
      const oldZIndices = new Map([['shape2', 150]])
      const newZIndices = new Map([['shape2', 100]]) // swapped with shape at 100

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape2', { zIndex: 100 })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty shape list', () => {
      const command = new ZIndexCommand(
        [],
        new Map(),
        new Map(),
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).not.toHaveBeenCalled()
      expect(syncZIndexMock).not.toHaveBeenCalled()
    })

    it('should handle shapes with missing z-index data', () => {
      const shapeIds = ['shape1', 'shape2']
      const oldZIndices = new Map([['shape1', 100]])
      const newZIndices = new Map([['shape1', 200]])
      // shape2 missing in maps

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      // Should only update shape1
      expect(updateShapeStateMock).toHaveBeenCalledTimes(1)
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 200 })
    })

    it('should handle sync failures gracefully', async () => {
      const syncFailMock = vi.fn().mockRejectedValue(new Error('Sync failed'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 100]])
      const newZIndices = new Map([['shape1', 200]])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncFailMock
      )

      command.execute()

      // updateShapeState should still be called
      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 200 })
      
      // Wait for promise rejection
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should not throw, just log error
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle very large z-index values', () => {
      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 999999]])
      const newZIndices = new Map([['shape1', 1000000]])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: 1000000 })
    })

    it('should handle negative z-index values', () => {
      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 0]])
      const newZIndices = new Map([['shape1', -1]])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      command.execute()

      expect(updateShapeStateMock).toHaveBeenCalledWith('shape1', { zIndex: -1 })
    })
  })

  describe('Command Type', () => {
    it('should have correct command type', () => {
      const command = new ZIndexCommand(
        [],
        new Map(),
        new Map(),
        updateShapeStateMock,
        syncZIndexMock
      )

      expect(command.type).toBe('zindex')
    })
  })

  describe('Multiple Undo/Redo Cycles', () => {
    it('should handle multiple undo/redo cycles correctly', () => {
      const shapeIds = ['shape1']
      const oldZIndices = new Map([['shape1', 100]])
      const newZIndices = new Map([['shape1', 200]])

      const command = new ZIndexCommand(
        shapeIds,
        oldZIndices,
        newZIndices,
        updateShapeStateMock,
        syncZIndexMock
      )

      // Execute
      command.execute()
      expect(updateShapeStateMock).toHaveBeenLastCalledWith('shape1', { zIndex: 200 })

      // Undo
      command.undo()
      expect(updateShapeStateMock).toHaveBeenLastCalledWith('shape1', { zIndex: 100 })

      // Redo
      command.redo()
      expect(updateShapeStateMock).toHaveBeenLastCalledWith('shape1', { zIndex: 200 })

      // Undo again
      command.undo()
      expect(updateShapeStateMock).toHaveBeenLastCalledWith('shape1', { zIndex: 100 })

      // Total calls: execute + undo + redo + undo = 4
      expect(updateShapeStateMock).toHaveBeenCalledTimes(4)
    })
  })
})


