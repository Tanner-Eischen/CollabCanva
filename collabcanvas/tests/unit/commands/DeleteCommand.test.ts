import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeleteCommand } from '../../../src/commands/DeleteCommand'
import type { Shape } from '../../../src/types/canvas'

describe('DeleteCommand', () => {
  let mockShape: Shape
  let mockAddShapeToState: ReturnType<typeof vi.fn>
  let mockRemoveShapeFromState: ReturnType<typeof vi.fn>
  let mockSyncCreate: ReturnType<typeof vi.fn>
  let mockSyncDelete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockShape = {
      id: 'test-shape-1',
      type: 'circle',
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      rotation: 45,
    }

    mockAddShapeToState = vi.fn()
    mockRemoveShapeFromState = vi.fn()
    mockSyncCreate = vi.fn(() => Promise.resolve())
    mockSyncDelete = vi.fn(() => Promise.resolve())
  })

  it('should have type "delete"', () => {
    const command = new DeleteCommand(
      mockShape,
      mockAddShapeToState,
      mockRemoveShapeFromState,
      mockSyncCreate,
      mockSyncDelete
    )

    expect(command.type).toBe('delete')
  })

  describe('execute', () => {
    it('should remove shape from state', () => {
      const command = new DeleteCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.execute()

      expect(mockRemoveShapeFromState).toHaveBeenCalledWith(mockShape.id)
    })

    it('should sync shape deletion to Firebase', () => {
      const command = new DeleteCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.execute()

      expect(mockSyncDelete).toHaveBeenCalledWith(mockShape.id)
    })
  })

  describe('undo', () => {
    it('should recreate shape with same ID and properties', () => {
      const command = new DeleteCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.undo()

      expect(mockAddShapeToState).toHaveBeenCalledWith(mockShape)
    })

    it('should sync shape recreation to Firebase', () => {
      const command = new DeleteCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.undo()

      expect(mockSyncCreate).toHaveBeenCalledWith(mockShape)
    })
  })

  describe('redo', () => {
    it('should delete shape again', () => {
      const command = new DeleteCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.redo()

      expect(mockRemoveShapeFromState).toHaveBeenCalledWith(mockShape.id)
    })

    it('should re-sync shape deletion to Firebase', () => {
      const command = new DeleteCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.redo()

      expect(mockSyncDelete).toHaveBeenCalledWith(mockShape.id)
    })
  })

  describe('complete cycle', () => {
    it('should handle execute -> undo -> redo correctly', () => {
      const command = new DeleteCommand(
        mockShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      // Execute (delete)
      command.execute()
      expect(mockRemoveShapeFromState).toHaveBeenCalledTimes(1)
      expect(mockSyncDelete).toHaveBeenCalledTimes(1)

      // Undo (recreate)
      command.undo()
      expect(mockAddShapeToState).toHaveBeenCalledTimes(1)
      expect(mockSyncCreate).toHaveBeenCalledTimes(1)

      // Redo (delete again)
      command.redo()
      expect(mockRemoveShapeFromState).toHaveBeenCalledTimes(2)
      expect(mockSyncDelete).toHaveBeenCalledTimes(2)
    })
  })

  describe('preserves shape properties', () => {
    it('should preserve all shape properties including rotation', () => {
      const shapeWithRotation: Shape = {
        id: 'rotated-shape',
        type: 'rectangle',
        x: 150,
        y: 150,
        width: 200,
        height: 100,
        rotation: 90,
      }

      const command = new DeleteCommand(
        shapeWithRotation,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.undo()

      expect(mockAddShapeToState).toHaveBeenCalledWith(shapeWithRotation)
    })

    it('should preserve text content', () => {
      const textShape: Shape = {
        id: 'text-shape',
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 30,
        text: 'Hello World',
      }

      const command = new DeleteCommand(
        textShape,
        mockAddShapeToState,
        mockRemoveShapeFromState,
        mockSyncCreate,
        mockSyncDelete
      )

      command.undo()

      expect(mockAddShapeToState).toHaveBeenCalledWith(textShape)
    })
  })
})

