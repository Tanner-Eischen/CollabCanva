import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  syncCreateShape,
  syncUpdateShape,
  syncDeleteShape,
  syncSelection,
  subscribeToCanvas,
} from '../../../src/services/canvasSync'
import * as firebaseDatabase from 'firebase/database'
import type { Shape } from '../../../src/types/canvas'
import type { CanvasObject } from '../../../src/types/firebase'

// Mock firebase/database
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
}))

// Mock firebase service
vi.mock('../../../src/services/firebase', () => ({
  db: {},
}))

describe('Canvas Sync Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Data Compression', () => {
    it('should compress rectangle with short keys (t, x, y, w, h)', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      const rectangle: Shape = {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
      }

      await syncCreateShape('test', 'rect-1', rectangle)

      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, {
        t: 'r',
        x: 100,
        y: 200,
        w: 100,
        h: 100,
      })
    })

    it('should compress circle with t=c', async () => {
      const mockRef = { path: 'canvas/test/objects/circle-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      const circle: Shape = {
        id: 'circle-1',
        type: 'circle',
        x: 150,
        y: 250,
        width: 100,
        height: 100,
      }

      await syncCreateShape('test', 'circle-1', circle)

      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, {
        t: 'c',
        x: 150,
        y: 250,
        w: 100,
        h: 100,
      })
    })

    it('should compress text with t=t and txt property', async () => {
      const mockRef = { path: 'canvas/test/objects/text-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      const text: Shape = {
        id: 'text-1',
        type: 'text',
        x: 50,
        y: 75,
        width: 200,
        height: 30,
        text: 'Hello World',
      }

      await syncCreateShape('test', 'text-1', text)

      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, {
        t: 't',
        x: 50,
        y: 75,
        w: 200,
        h: 30,
        txt: 'Hello World',
      })
    })

    it('should NOT include color property', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-2' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      const rectangle: Shape = {
        id: 'rect-2',
        type: 'rectangle',
        x: 10,
        y: 20,
        width: 100,
        height: 100,
      }

      await syncCreateShape('test', 'rect-2', rectangle)

      const calledData = vi.mocked(firebaseDatabase.set).mock.calls[0][1]
      expect(calledData).not.toHaveProperty('color')
      expect(calledData).not.toHaveProperty('fill')
      expect(calledData).not.toHaveProperty('c')
    })

    it('should round coordinates to integers', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-3' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      const rectangle: Shape = {
        id: 'rect-3',
        type: 'rectangle',
        x: 123.456,
        y: 789.012,
        width: 100.7,
        height: 100.3,
      }

      await syncCreateShape('test', 'rect-3', rectangle)

      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, {
        t: 'r',
        x: 123, // rounded
        y: 789, // rounded
        w: 101, // rounded
        h: 100, // rounded
      })
    })
  })

  describe('syncCreateShape', () => {
    it('should create rectangle with correct data structure', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      const rectangle: Shape = {
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }

      await syncCreateShape('test', 'rect-1', rectangle)

      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'canvas/test/objects/rect-1'
      )
      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, {
        t: 'r',
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      })
    })

    it('should create circle with diameter 100 (not radius)', async () => {
      const mockRef = { path: 'canvas/test/objects/circle-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      const circle: Shape = {
        id: 'circle-1',
        type: 'circle',
        x: 0,
        y: 0,
        width: 100, // diameter
        height: 100, // diameter
      }

      await syncCreateShape('test', 'circle-1', circle)

      const calledData = vi.mocked(firebaseDatabase.set).mock.calls[0][1]
      expect(calledData.w).toBe(100) // diameter, not radius
      expect(calledData.h).toBe(100)
    })

    it('should handle errors gracefully', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockRejectedValue(
        new Error('Network error')
      )

      const rectangle: Shape = {
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }

      await expect(
        syncCreateShape('test', 'rect-1', rectangle)
      ).rejects.toThrow('Network error')
    })
  })

  describe('syncUpdateShape', () => {
    it('should only send changed position properties', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.update).mockResolvedValue(undefined)

      await syncUpdateShape('test', 'rect-1', { x: 150, y: 200 })

      expect(firebaseDatabase.update).toHaveBeenCalledWith(mockRef, {
        x: 150,
        y: 200,
      })
    })

    it('should only send x if only x changed', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.update).mockResolvedValue(undefined)

      await syncUpdateShape('test', 'rect-1', { x: 250 })

      expect(firebaseDatabase.update).toHaveBeenCalledWith(mockRef, {
        x: 250,
      })
    })

    it('should round coordinates to integers', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.update).mockResolvedValue(undefined)

      await syncUpdateShape('test', 'rect-1', { x: 123.789, y: 456.123 })

      expect(firebaseDatabase.update).toHaveBeenCalledWith(mockRef, {
        x: 124,
        y: 456,
      })
    })

    it('should handle errors gracefully', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.update).mockRejectedValue(
        new Error('Permission denied')
      )

      await expect(
        syncUpdateShape('test', 'rect-1', { x: 100, y: 200 })
      ).rejects.toThrow('Permission denied')
    })
  })

  describe('syncDeleteShape', () => {
    it('should remove shape from Firebase', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.remove).mockResolvedValue(undefined)

      await syncDeleteShape('test', 'rect-1')

      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'canvas/test/objects/rect-1'
      )
      expect(firebaseDatabase.remove).toHaveBeenCalledWith(mockRef)
    })

    it('should handle errors gracefully', async () => {
      const mockRef = { path: 'canvas/test/objects/rect-1' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.remove).mockRejectedValue(
        new Error('Network error')
      )

      await expect(syncDeleteShape('test', 'rect-1')).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('syncSelection', () => {
    it('should write selection to presence/${userId}/sel', async () => {
      const mockRef = { path: 'presence/user-1/sel' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      await syncSelection('user-1', 'shape-123')

      expect(firebaseDatabase.ref).toHaveBeenCalledWith(
        expect.anything(),
        'presence/user-1/sel'
      )
      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, 'shape-123')
    })

    it('should write null when clearing selection', async () => {
      const mockRef = { path: 'presence/user-1/sel' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined)

      await syncSelection('user-1', null)

      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, null)
    })

    it('should handle errors gracefully', async () => {
      const mockRef = { path: 'presence/user-1/sel' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.set).mockRejectedValue(
        new Error('Permission denied')
      )

      await expect(syncSelection('user-1', 'shape-123')).rejects.toThrow(
        'Permission denied'
      )
    })
  })

  describe('Data Decompression', () => {
    it('should decompress rectangle data correctly', () => {
      const mockRef = { path: 'canvas/test/objects' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)

      const onCreate = vi.fn()
      
      vi.mocked(firebaseDatabase.onValue).mockImplementation(
        (ref: any, callback: any) => {
          // Simulate Firebase data
          const snapshot = {
            val: () => ({
              'rect-1': {
                t: 'r',
                x: 100,
                y: 200,
                w: 100,
                h: 100,
              },
            }),
          }
          callback(snapshot)
          return () => {}
        }
      )

      subscribeToCanvas('test', { onCreate })

      expect(onCreate).toHaveBeenCalledWith({
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
      })
    })

    it('should decompress circle data correctly', () => {
      const mockRef = { path: 'canvas/test/objects' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)

      const onCreate = vi.fn()
      
      vi.mocked(firebaseDatabase.onValue).mockImplementation(
        (ref: any, callback: any) => {
          const snapshot = {
            val: () => ({
              'circle-1': {
                t: 'c',
                x: 150,
                y: 250,
                w: 100,
                h: 100,
              },
            }),
          }
          callback(snapshot)
          return () => {}
        }
      )

      subscribeToCanvas('test', { onCreate })

      expect(onCreate).toHaveBeenCalledWith({
        id: 'circle-1',
        type: 'circle',
        x: 150,
        y: 250,
        width: 100,
        height: 100,
      })
    })

    it('should decompress text data correctly', () => {
      const mockRef = { path: 'canvas/test/objects' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)

      const onCreate = vi.fn()
      
      vi.mocked(firebaseDatabase.onValue).mockImplementation(
        (ref: any, callback: any) => {
          const snapshot = {
            val: () => ({
              'text-1': {
                t: 't',
                x: 50,
                y: 75,
                w: 200,
                h: 30,
                txt: 'Hello',
              },
            }),
          }
          callback(snapshot)
          return () => {}
        }
      )

      subscribeToCanvas('test', { onCreate })

      expect(onCreate).toHaveBeenCalledWith({
        id: 'text-1',
        type: 'text',
        x: 50,
        y: 75,
        width: 200,
        height: 30,
        text: 'Hello',
      })
    })
  })

  describe('subscribeToCanvas', () => {
    it('should call onCreate when new shape appears', () => {
      const mockRef = { path: 'canvas/test/objects' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)

      const onCreate = vi.fn()
      
      vi.mocked(firebaseDatabase.onValue).mockImplementation(
        (ref: any, callback: any) => {
          // First call - empty
          callback({ val: () => null })
          
          // Second call - shape added
          callback({
            val: () => ({
              'rect-1': { t: 'r', x: 0, y: 0, w: 100, h: 100 },
            }),
          })
          
          return () => {}
        }
      )

      subscribeToCanvas('test', { onCreate })

      expect(onCreate).toHaveBeenCalledTimes(1)
    })

    it('should call onUpdate when shape position changes', () => {
      const mockRef = { path: 'canvas/test/objects' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)

      const onUpdate = vi.fn()
      let callCount = 0
      
      vi.mocked(firebaseDatabase.onValue).mockImplementation(
        (ref: any, callback: any) => {
          if (callCount === 0) {
            // Initial state
            callback({
              val: () => ({
                'rect-1': { t: 'r', x: 0, y: 0, w: 100, h: 100 },
              }),
            })
          } else {
            // Position changed
            callback({
              val: () => ({
                'rect-1': { t: 'r', x: 50, y: 100, w: 100, h: 100 },
              }),
            })
          }
          callCount++
          return () => {}
        }
      )

      const unsubscribe = subscribeToCanvas('test', { onUpdate })
      
      // Trigger second call
      vi.mocked(firebaseDatabase.onValue).mock.calls[0][1]({
        val: () => ({
          'rect-1': { t: 'r', x: 50, y: 100, w: 100, h: 100 },
        }),
      })

      expect(onUpdate).toHaveBeenCalledWith('rect-1', { x: 50, y: 100 })
    })

    it('should call onDelete when shape is removed', () => {
      const mockRef = { path: 'canvas/test/objects' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)

      const onDelete = vi.fn()
      
      vi.mocked(firebaseDatabase.onValue).mockImplementation(
        (ref: any, callback: any) => {
          // First call - shape exists
          callback({
            val: () => ({
              'rect-1': { t: 'r', x: 0, y: 0, w: 100, h: 100 },
            }),
          })
          
          // Second call - shape deleted
          callback({ val: () => null })
          
          return () => {}
        }
      )

      subscribeToCanvas('test', { onDelete })

      // Manually trigger second callback
      const callback = vi.mocked(firebaseDatabase.onValue).mock.calls[0][1]
      callback({ val: () => null })

      expect(onDelete).toHaveBeenCalledWith('rect-1')
    })

    it('should return unsubscribe function', () => {
      const mockRef = { path: 'canvas/test/objects' }
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any)
      vi.mocked(firebaseDatabase.onValue).mockReturnValue(() => {})

      const unsubscribe = subscribeToCanvas('test', {})

      expect(typeof unsubscribe).toBe('function')
      
      unsubscribe()
      
      expect(firebaseDatabase.off).toHaveBeenCalled()
    })
  })
})

