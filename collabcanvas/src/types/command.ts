// Command Pattern Types for Undo/Redo (PR-14)

/**
 * Command interface for undo/redo operations
 * All commands must implement execute, undo, and redo methods
 */
export interface Command {
  type: 'create' | 'delete' | 'move' | 'transform' | 'bulk' | 'color' | 'zindex' | 'alignment'
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
 * Command type for color changes (PR-15)
 */
export type ColorCommandType = 'color'

/**
 * Command type for z-index changes (PR-17)
 */
export type ZIndexCommandType = 'zindex'

/**
 * Command type for alignment operations (PR-18)
 */
export type AlignmentCommandType = 'alignment'

/**
 * Union type of all command types
 */
export type CommandType = CreateCommandType | DeleteCommandType | MoveCommandType | TransformCommandType | BulkCommandType | ColorCommandType | ZIndexCommandType | AlignmentCommandType

