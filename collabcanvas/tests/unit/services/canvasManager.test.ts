import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, set, get, remove, update } from 'firebase/database'
import {
  createCanvas,
  deleteCanvas,
  updateCanvas,
  getCanvasList,
  duplicateCanvas,
  generateThumbnail,
  getCanvas,
  hasCanvasPermission,
  getCanvasPermission,
} from '../../../src/services/canvasManager'

// Mock Firebase database
vi.mock('firebase/database')
vi.mock('../../../src/services/firebase', () => ({
  db: {},
}))

describe('Canvas Manager Service (PR-22)', () => {
  const mockUserId = 'test-user-123'
  const mockCanvasId = 'canvas-12345'

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1234567890)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCanvas', () => {
    it('should generate unique canvas ID', async () => {
      vi.mocked(set).mockResolvedValue()

      const canvas1 = await createCanvas('Canvas 1', mockUserId)
      const canvas2 = await createCanvas('Canvas 2', mockUserId)

      expect(canvas1.id).not.toBe(canvas2.id)
      expect(canvas1.id).toMatch(/^canvas-/)
      expect(canvas2.id).toMatch(/^canvas-/)
    })

    it('should create canvas with metadata and owner permission', async () => {
      vi.mocked(set).mockResolvedValue()

      const canvas = await createCanvas('Test Canvas', mockUserId)

      expect(canvas).toMatchObject({
        name: 'Test Canvas',
        createdAt: 1234567890,
        updatedAt: 1234567890,
        thumbnail: '',
        ownerId: mockUserId,
      })

      // Should call set twice: once for metadata, once for permission
      expect(set).toHaveBeenCalledTimes(2)
    })

    it('should set owner permission', async () => {
      vi.mocked(set).mockResolvedValue()

      await createCanvas('Test Canvas', mockUserId)

      // Check that permission was set
      const permissionCall = vi.mocked(set).mock.calls[1]
      expect(permissionCall[1]).toMatchObject({
        role: 'owner',
        grantedAt: 1234567890,
      })
    })

    it('should throw error if Firebase fails', async () => {
      vi.mocked(set).mockRejectedValue(new Error('Firebase error'))

      await expect(createCanvas('Test Canvas', mockUserId)).rejects.toThrow(
        'Firebase error'
      )
    })
  })

  describe('deleteCanvas', () => {
    it('should remove canvas from user list', async () => {
      vi.mocked(remove).mockResolvedValue()

      await deleteCanvas(mockCanvasId, mockUserId)

      // Should call ref with user's canvas path
      expect(ref).toHaveBeenCalledWith(
        expect.anything(),
        `users/${mockUserId}/canvases/${mockCanvasId}`
      )
    })

    it('should remove all canvas data', async () => {
      vi.mocked(remove).mockResolvedValue()

      await deleteCanvas(mockCanvasId, mockUserId)

      // Should remove canvas data, objects, and presence
      expect(remove).toHaveBeenCalledTimes(3)
    })

    it('should throw error if Firebase fails', async () => {
      vi.mocked(remove).mockRejectedValue(new Error('Firebase error'))

      await expect(deleteCanvas(mockCanvasId, mockUserId)).rejects.toThrow(
        'Firebase error'
      )
    })
  })

  describe('updateCanvas', () => {
    it('should update canvas metadata', async () => {
      vi.mocked(update).mockResolvedValue()

      await updateCanvas(mockCanvasId, mockUserId, { name: 'New Name' })

      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'New Name',
          updatedAt: 1234567890,
        })
      )
    })

    it('should update thumbnail', async () => {
      vi.mocked(update).mockResolvedValue()

      await updateCanvas(mockCanvasId, mockUserId, {
        thumbnail: 'data:image/png;base64,xyz',
      })

      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          thumbnail: 'data:image/png;base64,xyz',
          updatedAt: 1234567890,
        })
      )
    })
  })

  describe('getCanvasList', () => {
    it('should return empty array if no canvases', async () => {
      vi.mocked(get).mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any)

      const canvases = await getCanvasList(mockUserId)

      expect(canvases).toEqual([])
    })

    it('should return user canvases sorted by updatedAt', async () => {
      const mockCanvases = {
        'canvas-1': {
          id: 'canvas-1',
          name: 'Canvas 1',
          updatedAt: 1000,
          createdAt: 1000,
          thumbnail: '',
          ownerId: mockUserId,
        },
        'canvas-2': {
          id: 'canvas-2',
          name: 'Canvas 2',
          updatedAt: 3000,
          createdAt: 2000,
          thumbnail: '',
          ownerId: mockUserId,
        },
        'canvas-3': {
          id: 'canvas-3',
          name: 'Canvas 3',
          updatedAt: 2000,
          createdAt: 1500,
          thumbnail: '',
          ownerId: mockUserId,
        },
      }

      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockCanvases,
      } as any)

      const canvases = await getCanvasList(mockUserId)

      expect(canvases).toHaveLength(3)
      expect(canvases[0].id).toBe('canvas-2') // Most recent
      expect(canvases[1].id).toBe('canvas-3')
      expect(canvases[2].id).toBe('canvas-1') // Oldest
    })
  })

  describe('duplicateCanvas', () => {
    it('should create copy with new ID', async () => {
      const mockSourceCanvas = {
        id: mockCanvasId,
        name: 'Original Canvas',
        createdAt: 1000,
        updatedAt: 2000,
        thumbnail: '',
        ownerId: mockUserId,
      }

      vi.mocked(get)
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockSourceCanvas,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ obj1: {} }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => false,
          val: () => null,
        } as any)

      vi.mocked(set).mockResolvedValue()

      const duplicatedCanvas = await duplicateCanvas(mockCanvasId, mockUserId)

      expect(duplicatedCanvas.name).toBe('Original Canvas (Copy)')
      expect(duplicatedCanvas.id).not.toBe(mockCanvasId)
    })

    it('should copy all objects', async () => {
      const mockSourceCanvas = {
        id: mockCanvasId,
        name: 'Original Canvas',
        createdAt: 1000,
        updatedAt: 2000,
        thumbnail: '',
        ownerId: mockUserId,
      }

      const mockObjects = {
        obj1: { type: 'rectangle', x: 100, y: 100 },
        obj2: { type: 'circle', x: 200, y: 200 },
      }

      vi.mocked(get)
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockSourceCanvas,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockObjects,
        } as any)
        .mockResolvedValueOnce({
          exists: () => false,
          val: () => null,
        } as any)

      vi.mocked(set).mockResolvedValue()

      await duplicateCanvas(mockCanvasId, mockUserId)

      // Should copy objects to new canvas
      expect(set).toHaveBeenCalledWith(expect.anything(), mockObjects)
    })

    it('should throw error if source canvas not found', async () => {
      vi.mocked(get).mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any)

      await expect(
        duplicateCanvas(mockCanvasId, mockUserId)
      ).rejects.toThrow('Source canvas not found')
    })
  })

  describe('generateThumbnail', () => {
    it('should return empty string if stage is null', () => {
      const thumbnail = generateThumbnail(null)

      expect(thumbnail).toBe('')
    })

    it('should generate base64 PNG from stage', () => {
      const mockStage = {
        width: () => 5000,
        height: () => 5000,
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc123'),
      } as any

      const thumbnail = generateThumbnail(mockStage)

      expect(thumbnail).toBe('data:image/png;base64,abc123')
      expect(mockStage.toDataURL).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'image/png',
          quality: 0.8,
        })
      )
    })

    it('should handle error gracefully', () => {
      const mockStage = {
        width: () => 5000,
        height: () => 5000,
        toDataURL: vi.fn().mockImplementation(() => {
          throw new Error('Canvas error')
        }),
      } as any

      const thumbnail = generateThumbnail(mockStage)

      expect(thumbnail).toBe('')
    })
  })

  describe('hasCanvasPermission', () => {
    it('should return true if user has permission', async () => {
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => ({ role: 'editor' }),
      } as any)

      const hasPermission = await hasCanvasPermission(mockCanvasId, mockUserId)

      expect(hasPermission).toBe(true)
    })

    it('should return false if user has no permission', async () => {
      vi.mocked(get).mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any)

      const hasPermission = await hasCanvasPermission(mockCanvasId, mockUserId)

      expect(hasPermission).toBe(false)
    })
  })

  describe('getCanvasPermission', () => {
    it('should return permission role', async () => {
      const mockPermission = {
        role: 'editor',
        grantedAt: 1234567890,
      }

      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => mockPermission,
      } as any)

      const permission = await getCanvasPermission(mockCanvasId, mockUserId)

      expect(permission).toEqual(mockPermission)
    })

    it('should return null if no permission', async () => {
      vi.mocked(get).mockResolvedValue({
        exists: () => false,
        val: () => null,
      } as any)

      const permission = await getCanvasPermission(mockCanvasId, mockUserId)

      expect(permission).toBeNull()
    })
  })
})

