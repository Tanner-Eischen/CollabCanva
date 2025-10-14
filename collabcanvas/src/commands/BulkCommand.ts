// BulkCommand - Undo/Redo for multiple operations at once (PR-14)

import type { Command } from '../types/command'

/**
 * Command for bulk operations (multiple commands executed together)
 * Undo: Undo all commands in reverse order
 * Redo: Redo all commands in original order
 */
export class BulkCommand implements Command {
  readonly type = 'bulk' as const
  
  private commands: Command[]

  constructor(commands: Command[]) {
    this.commands = commands
  }

  execute(): void {
    // Execute all commands in order
    this.commands.forEach((command) => {
      command.execute()
    })
  }

  undo(): void {
    // Undo all commands in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo()
    }
  }

  redo(): void {
    // Redo all commands in original order
    this.commands.forEach((command) => {
      command.redo()
    })
  }
}

