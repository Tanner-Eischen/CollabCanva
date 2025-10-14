// Command Pattern Types for Undo/Redo (PR-14)

/**
 * Command interface for undo/redo operations
 * All commands must implement execute, undo, and redo methods
 */
export interface Command {
  type: 'create' | 'delete' | 'move' | 'transform' | 'bulk'
  execute(): void
  undo(): void
  redo(): void
}

/**
 * Command type for creating shapes
 */
export type CreateCommandType = 'create'

/**
 * Command type for deleting shapes
 */
export type DeleteCommandType = 'delete'

/**
 * Command type for moving shapes
 */
export type MoveCommandType = 'move'

/**
 * Command type for transforming shapes (resize/rotate)
 */
export type TransformCommandType = 'transform'

/**
 * Command type for bulk operations (multiple commands at once)
 */
export type BulkCommandType = 'bulk'

/**
 * Union type of all command types
 */
export type CommandType = CreateCommandType | DeleteCommandType | MoveCommandType | TransformCommandType | BulkCommandType

