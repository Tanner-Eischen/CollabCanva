import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn, logOut } from '../../../src/services/auth'
import * as firebaseAuth from 'firebase/auth'

// Mock firebase/auth module
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}))

// Mock firebase service
vi.mock('../../../src/services/firebase', () => ({
  auth: {},
  db: {},
}))

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should create user and set display name', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: null,
        },
      }

      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue(
        mockUserCredential as any
      )
      vi.mocked(firebaseAuth.updateProfile).mockResolvedValue(undefined)

      const result = await signUp('test@example.com', 'password123', 'Test User')

      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(
        mockUserCredential.user,
        { displayName: 'Test User' }
      )
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      })
    })

    it('should handle email already in use error', async () => {
      const error = { code: 'auth/email-already-in-use', message: 'Error' }
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(
        error
      )

      await expect(
        signUp('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already in use')
    })

    it('should handle invalid email error', async () => {
      const error = { code: 'auth/invalid-email', message: 'Error' }
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(
        error
      )

      await expect(
        signUp('invalid-email', 'password123', 'Test User')
      ).rejects.toThrow('Invalid email address')
    })

    it('should handle weak password error', async () => {
      const error = { code: 'auth/weak-password', message: 'Error' }
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(
        error
      )

      await expect(signUp('test@example.com', '123', 'Test User')).rejects.toThrow(
        'Password should be at least 6 characters'
      )
    })

    it('should handle generic errors', async () => {
      const error = { code: 'auth/unknown', message: 'Unknown error' }
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(
        error
      )

      await expect(
        signUp('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Failed to create account: Unknown error')
    })
  })

  describe('signIn', () => {
    it('should sign in user with email and password', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
        },
      }

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue(
        mockUserCredential as any
      )

      const result = await signIn('test@example.com', 'password123')

      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      })
    })

    it('should handle user not found error', async () => {
      const error = { code: 'auth/user-not-found', message: 'Error' }
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(error)

      await expect(signIn('test@example.com', 'password123')).rejects.toThrow(
        'No account found with this email'
      )
    })

    it('should handle wrong password error', async () => {
      const error = { code: 'auth/wrong-password', message: 'Error' }
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(error)

      await expect(signIn('test@example.com', 'wrongpass')).rejects.toThrow(
        'Incorrect password'
      )
    })

    it('should handle user disabled error', async () => {
      const error = { code: 'auth/user-disabled', message: 'Error' }
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(error)

      await expect(signIn('test@example.com', 'password123')).rejects.toThrow(
        'This account has been disabled'
      )
    })

    it('should handle generic errors', async () => {
      const error = { code: 'auth/unknown', message: 'Unknown error' }
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(error)

      await expect(signIn('test@example.com', 'password123')).rejects.toThrow(
        'Failed to sign in: Unknown error'
      )
    })
  })

  describe('logOut', () => {
    it('should sign out user successfully', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValue(undefined)

      await logOut()

      expect(firebaseAuth.signOut).toHaveBeenCalledWith(expect.anything())
    })

    it('should handle sign out errors', async () => {
      const error = new Error('Network error')
      vi.mocked(firebaseAuth.signOut).mockRejectedValue(error)

      await expect(logOut()).rejects.toThrow('Failed to log out: Network error')
    })
  })
})

