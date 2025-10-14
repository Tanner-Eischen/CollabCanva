import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../../src/components/Login'
import ProtectedRoute from '../../src/components/ProtectedRoute'
import * as authService from '../../src/services/auth'
import * as useAuthHook from '../../src/hooks/useAuth'

// Mock auth service
vi.mock('../../src/services/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  logOut: vi.fn(),
}))

// Mock useAuth hook
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Component', () => {
    it('should render login form with email and password fields', () => {
      render(<Login />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should toggle between login and signup modes', async () => {
      const user = userEvent.setup()
      render(<Login />)

      // Initially in login mode
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument()

      // Click toggle to signup mode
      await user.click(screen.getByText(/don't have an account/i))

      // Now in signup mode
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()

      // Toggle back to login
      await user.click(screen.getByText(/already have an account/i))
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should show display name field in signup mode', async () => {
      const user = userEvent.setup()
      render(<Login />)

      // Switch to signup mode
      await user.click(screen.getByText(/don't have an account/i))

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<Login />)

      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      // Try to submit with empty fields - browser validation will prevent this
      // So we just verify the required attributes are set
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })

    it('should validate minimum password length', async () => {
      const user = userEvent.setup()
      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '123')
      await user.click(signInButton)

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('should validate display name in signup mode', async () => {
      const user = userEvent.setup()
      render(<Login />)

      // Switch to signup mode
      await user.click(screen.getByText(/don't have an account/i))

      const displayNameInput = screen.getByLabelText(/display name/i)
      
      // Verify displayName field is required in signup mode
      expect(displayNameInput).toHaveAttribute('required')
    })

    it('should display error messages from auth service', async () => {
      const user = userEvent.setup()
      vi.mocked(authService.signIn).mockRejectedValue(
        new Error('Incorrect password')
      )

      render(<Login />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
      })
    })

    it('should call signIn with correct credentials', async () => {
      const user = userEvent.setup()
      vi.mocked(authService.signIn).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      })

      render(<Login />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        )
      })
    })

    it('should call signUp with correct data', async () => {
      const user = userEvent.setup()
      vi.mocked(authService.signUp).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      })

      render(<Login />)

      // Switch to signup mode
      await user.click(screen.getByText(/don't have an account/i))

      await user.type(screen.getByLabelText(/display name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'Test User'
        )
      })
    })

    it('should show loading spinner during authentication', async () => {
      const user = userEvent.setup()
      vi.mocked(authService.signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<Login />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })
  })

  describe('ProtectedRoute Component', () => {
    it('should show login when not authenticated', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        loading: false,
      })

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should show children when authenticated', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
        },
        loading: false,
      })

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByText(/sign in to continue/i)).not.toBeInTheDocument()
    })

    it('should show loading state while checking auth', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        loading: true,
      })

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })
})

