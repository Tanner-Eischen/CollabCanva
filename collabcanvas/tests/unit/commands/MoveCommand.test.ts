import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MoveCommand } from '../../../src/commands/MoveCommand'

describe('MoveCommand', () => {
  let mockUpdateShapeInState: ReturnType<typeof vi.fn>
  let mockSyncUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUpdateShapeInState = vi.fn()
    mockSyncUpdate = vi.fn(() => Promise.resolve())
  })

  it('should have type "move"', () => {
    const command = new MoveCommand(
      'shape-1',
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      mockUpdateShapeInState,
      mockSyncUpdate
    )

    expect(command.type).toBe('move')
  })

  describe('execute', () => {
    it('should apply new position to state', () => {
      const command = new MoveCommand(
        'shape-1',
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        mockUpdateShapeInState,
        mockSyncUpdate
      )

      command.execute()

      expect(mockUpdateShapeInState).toHaveBeenCalledWith('shape-1', {
        x: 200,
        y: 200,
      })
    })

    it('should sync new position to Firebase', () => {
      const command = new MoveCommand(
        'shape-1',
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        mockUpdateShapeInState,
        mockSyncUpdate
      )

      command.execute()

      expect(mockSyncUpdate).toHaveBeenCalledWith('shape-1', {
        x: 200,
        y: 200,
      })
    })
  })

  describe('undo', () => {
    it('should restore old position in state', () => {
      const command = new MoveCommand(
        'shape-1',
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        mockUpdateShapeInState,
        mockSyncUpdate
      )

      command.undo()

      expect(mockUpdateShapeInState).toHaveBeenCalledWith('shape-1', {
        x: 100,
        y: 100,
      })
    })

    it('should sync old position to Firebase', () => {
      const command = new MoveCommand(
        'shape-1',
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        mockUpdateShapeInState,
        mockSyncUpdate
      )

      command.undo()

      expect(mockSyncUpdate).toHaveBeenCalledWith('shape-1', {
        x: 100,
        y: 100,
      })
    })
  })

  describe('redo', () => {
    it('should re-apply new position to state', () => {
      const command = new MoveCommand(
        'shape-1',
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        mockUpdateShapeInState,
        mockSyncUpdate
      )

      command.redo()

      expect(mockUpdateShapeInState).toHaveBeenCalledWith('shape-1', {
        x: 200,
        y: 200,
      })
    })

    it('should re-sync new position to Firebase', () => {
      const command = new MoveCommand(
        'shape-1',
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        mockUpdateShapeInState,
        mockSyncUpdate
      )

      command.redo()

      expect(mockSyncUpdate).toHaveBeenCalledWith('shape-1', {
        x: 200,
        y: 200,
      })
    })
  })

  describe('complete cycle', () => {
    it('should handle execute -> undo -> redo correctly', () => {
      const command = new MoveCommand(
        'shape-1',
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        mockUpdateShapeInState,
        mockSyncUpdate
      )

      // Execute (move to new position)
      command.execute()
      expect(mockUpdateShapeInState).toHaveBeenLastCalledWith('shape-1', {
        x: 200,
        y: 200,
      })

      // Undo (move back to old position)
      command.undo()
      expect(mockUpdateShapeInState).toHaveBeenLastCalledWith('shape-1', {
        x: 100,
        y: 100,
      })

      // Redo (move to new position again)
      command.redo()
      expect(mockUpdateShapeInState).toHaveBeenLastCalledWith('shape-1', {
        x: 200,
        y: 200,
      })
    })
  })
})

