import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHistoryManager } from '../../../src/services/commandHistory'
import type { Command } from '../../../src/types/command'

// Mock command for testing
class MockCommand implements Command {
  type = 'create' as const
  executed = false
  undone = false
  redone = false

  execute(): void {
    this.executed = true
  }

  undo(): void {
    this.undone = true
  }

  redo(): void {
    this.redone = true
  }
}

describe('Command History Manager', () => {
  let historyManager: ReturnType<typeof createHistoryManager>

  beforeEach(() => {
    historyManager = createHistoryManager()
  })

  describe('executeCommand', () => {
    it('should execute the command', () => {
      const command = new MockCommand()
      historyManager.executeCommand(command)

      expect(command.executed).toBe(true)
    })

    it('should add command to undo stack', () => {
      const command = new MockCommand()
      historyManager.executeCommand(command)

      expect(historyManager.canUndo()).toBe(true)
    })

    it('should clear redo stack when new command is executed', () => {
      const command1 = new MockCommand()
      const command2 = new MockCommand()

      historyManager.executeCommand(command1)
      historyManager.undo()

      expect(historyManager.canRedo()).toBe(true)

      historyManager.executeCommand(command2)

      expect(historyManager.canRedo()).toBe(false)
    })

    it('should limit undo stack to 50 commands', () => {
      // Add 51 commands
      for (let i = 0; i < 51; i++) {
        historyManager.executeCommand(new MockCommand())
      }

      // Undo 50 times (should work)
      for (let i = 0; i < 50; i++) {
        expect(historyManager.canUndo()).toBe(true)
        historyManager.undo()
      }

      // 51st undo should not work (oldest was removed)
      expect(historyManager.canUndo()).toBe(false)
    })
  })

  describe('undo', () => {
    it('should call command.undo()', () => {
      const command = new MockCommand()
      historyManager.executeCommand(command)
      historyManager.undo()

      expect(command.undone).toBe(true)
    })

    it('should move command from undo stack to redo stack', () => {
      const command = new MockCommand()
      historyManager.executeCommand(command)

      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(false)

      historyManager.undo()

      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(true)
    })

    it('should do nothing when undo stack is empty', () => {
      expect(historyManager.canUndo()).toBe(false)
      expect(() => historyManager.undo()).not.toThrow()
    })
  })

  describe('redo', () => {
    it('should call command.redo()', () => {
      const command = new MockCommand()
      historyManager.executeCommand(command)
      historyManager.undo()
      historyManager.redo()

      expect(command.redone).toBe(true)
    })

    it('should move command from redo stack to undo stack', () => {
      const command = new MockCommand()
      historyManager.executeCommand(command)
      historyManager.undo()

      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(true)

      historyManager.redo()

      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(false)
    })

    it('should do nothing when redo stack is empty', () => {
      expect(historyManager.canRedo()).toBe(false)
      expect(() => historyManager.redo()).not.toThrow()
    })
  })

  describe('canUndo', () => {
    it('should return false when undo stack is empty', () => {
      expect(historyManager.canUndo()).toBe(false)
    })

    it('should return true when undo stack has commands', () => {
      historyManager.executeCommand(new MockCommand())
      expect(historyManager.canUndo()).toBe(true)
    })
  })

  describe('canRedo', () => {
    it('should return false when redo stack is empty', () => {
      expect(historyManager.canRedo()).toBe(false)
    })

    it('should return true when redo stack has commands', () => {
      historyManager.executeCommand(new MockCommand())
      historyManager.undo()
      expect(historyManager.canRedo()).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear both undo and redo stacks', () => {
      historyManager.executeCommand(new MockCommand())
      historyManager.executeCommand(new MockCommand())
      historyManager.undo()

      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(true)

      historyManager.clear()

      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(false)
    })
  })

  describe('getUndoStackSize', () => {
    it('should return 0 when stack is empty', () => {
      expect(historyManager.getUndoStackSize()).toBe(0)
    })

    it('should return correct stack size', () => {
      historyManager.executeCommand(new MockCommand())
      expect(historyManager.getUndoStackSize()).toBe(1)

      historyManager.executeCommand(new MockCommand())
      expect(historyManager.getUndoStackSize()).toBe(2)
    })
  })

  describe('getRedoStackSize', () => {
    it('should return 0 when stack is empty', () => {
      expect(historyManager.getRedoStackSize()).toBe(0)
    })

    it('should return correct stack size', () => {
      historyManager.executeCommand(new MockCommand())
      historyManager.executeCommand(new MockCommand())
      historyManager.undo()
      expect(historyManager.getRedoStackSize()).toBe(1)

      historyManager.undo()
      expect(historyManager.getRedoStackSize()).toBe(2)
    })
  })

  describe('Multiple undo/redo sequence', () => {
    it('should handle multiple undos in sequence', () => {
      const commands = [new MockCommand(), new MockCommand(), new MockCommand()]

      commands.forEach((cmd) => historyManager.executeCommand(cmd))

      // Undo all
      historyManager.undo()
      expect(commands[2].undone).toBe(true)

      historyManager.undo()
      expect(commands[1].undone).toBe(true)

      historyManager.undo()
      expect(commands[0].undone).toBe(true)

      expect(historyManager.canUndo()).toBe(false)
    })

    it('should handle multiple redos in sequence', () => {
      const commands = [new MockCommand(), new MockCommand(), new MockCommand()]

      commands.forEach((cmd) => historyManager.executeCommand(cmd))

      // Undo all
      historyManager.undo()
      historyManager.undo()
      historyManager.undo()

      // Redo all
      historyManager.redo()
      expect(commands[0].redone).toBe(true)

      historyManager.redo()
      expect(commands[1].redone).toBe(true)

      historyManager.redo()
      expect(commands[2].redone).toBe(true)

      expect(historyManager.canRedo()).toBe(false)
    })
  })
})

