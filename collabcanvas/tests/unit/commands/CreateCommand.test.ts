import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateCommand } from '../../../src/commands/CreateCommand'
import type { Shape } from '../../../src/types/canvas'

describe('CreateCommand', () => {
  let mockShape: Shape
  let mockAddShapeToState: ReturnType<typeof vi.fn>
  let mockRemoveShapeFromState: ReturnType<typeof vi.fn>
  let mockSyncCreate: ReturnType<typeof vi.fn>
  let mockSyncDelete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockShape = {
      id: 'test-shape-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    }

    mockAddShapeToState = vi.fn()
    mockRemoveShapeFromState = vi.fn()
    mockSyncCreate = vi.fn(() => Promise.resolve())
    mockSyncDelete = vi.fn(() => Promise.resolve())
  })

  it('should have type "create"', () => {
    const command = new CreateCommand(
      mockShape,
      mockAddShapeToState,
      mockRemoveShapeFromState,
      mockSyncCreate,
      mockSyncDelete
    )

    expect(command.type).toBe('create')
  })

  describe('execute', () => {
    it('should add shape to state', () => {
      const command = new CreateCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.execute()

      expect(mockAddShapeToState).toHaveBeenCalledWith(mockShape)
    })

    it('should sync shape creation to Firebase', () => {
      const command = new CreateCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.execute()

      expect(mockSyncCreate).toHaveBeenCalledWith(mockShape)
    })
  })

  describe('undo', () => {
    it('should remove shape from state', () => {
      const command = new CreateCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.undo()

      expect(mockRemoveShapeFromState).toHaveBeenCalledWith(mockShape.id)
    })

    it('should sync shape deletion to Firebase', () => {
      const command = new CreateCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.undo()

      expect(mockSyncDelete).toHaveBeenCalledWith(mockShape.id)
    })
  })

  describe('redo', () => {
    it('should re-add shape to state', () => {
      const command = new CreateCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.redo()

      expect(mockAddShapeToState).toHaveBeenCalledWith(mockShape)
    })

    it('should re-sync shape creation to Firebase', () => {
      const command = new CreateCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.redo()

      expect(mockSyncCreate).toHaveBeenCalledWith(mockShape)
    })
  })

  describe('complete cycle', () => {
    it('should handle execute -> undo -> redo correctly', () => {
      const command = new CreateCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      // Execute
      command.execute()
      expect(mockAddShapeToState).toHaveBeenCalledTimes(1)
      expect(mockSyncCreate).toHaveBeenCalledTimes(1)

      // Undo
      command.undo()
      expect(mockRemoveShapeFromState).toHaveBeenCalledTimes(1)
      expect(mockSyncDelete).toHaveBeenCalledTimes(1)

      // Redo
      command.redo()
      expect(mockAddShapeToState).toHaveBeenCalledTimes(2)
      expect(mockSyncCreate).toHaveBeenCalledTimes(2)
    })
  })
})

