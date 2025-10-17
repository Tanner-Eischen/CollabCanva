// Command History Manager for Undo/Redo (PR-14)

import type { Command } from '../../types/command'

/**
 * Maximum number of commands to keep in history
 */
const MAX_HISTORY_SIZE = 50

/**
 * History Manager class for managing undo/redo stacks
 * Per-user history (not global)
 */
export class HistoryManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []

  /**
   * Execute a command and add it to the undo stack
   * Clears the redo stack when a new command is executed
   */
  executeCommand(command: Command): void {
    // Execute the command
    command.execute()

    // Add to undo stack
    this.undoStack.push(command)

    // Limit stack size
    if (this.undoStack.length > MAX_HISTORY_SIZE) {
      this.undoStack.shift() // Remove oldest command
    }

    // Clear redo stack (new action invalidates redo history)
    this.redoStack = []
  }

  /**
   * Undo the last command
   * Moves command from undo stack to redo stack
   */
  undo(): void {
    const command = this.undoStack.pop()
    if (command) {
      command.undo()
      this.redoStack.push(command)
    }
  }

  /**
   * Redo the last undone command
   * Moves command from redo stack to undo stack
   */
  redo(): void {
    const command = this.redoStack.pop()
    if (command) {
      command.redo()
      this.undoStack.push(command)
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Clear both undo and redo stacks
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * Get the size of the undo stack
   */
  getUndoStackSize(): number {
    return this.undoStack.length
  }

  /**
   * Get the size of the redo stack
   */
  getRedoStackSize(): number {
    return this.redoStack.length
  }
}

/**
 * Create a new HistoryManager instance
 */
export function createHistoryManager(): HistoryManager {
  return new HistoryManager()
}

