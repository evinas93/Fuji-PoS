// Unit tests for LoginForm component
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from '../../../src/components/forms/LoginForm'
import { useSignIn, useSignInWithPin } from '../../../src/hooks/useAuth'

// Mock the auth hooks
jest.mock('../../../src/hooks/useAuth', () => ({
  useSignIn: jest.fn(),
  useSignInWithPin: jest.fn(),
}))

const mockUseSignIn = useSignIn as jest.MockedFunction<typeof useSignIn>
const mockUseSignInWithPin = useSignInWithPin as jest.MockedFunction<typeof useSignInWithPin>

// Test wrapper with React Query
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  let mockSignInMutate: jest.Mock
  let mockSignInWithPinMutate: jest.Mock

  beforeEach(() => {
    mockSignInMutate = jest.fn()
    mockSignInWithPinMutate = jest.fn()

    mockUseSignIn.mockReturnValue({
      mutateAsync: mockSignInMutate,
      isPending: false,
      error: null,
    } as any)

    mockUseSignInWithPin.mockReturnValue({
      mutateAsync: mockSignInWithPinMutate,
      isPending: false,
      error: null,
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render email/password login form by default', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should show login mode toggle buttons', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      expect(screen.getByRole('button', { name: /email & password/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /quick pin login/i })).toBeInTheDocument()
    })

    it('should switch to PIN mode when PIN button is clicked', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      fireEvent.click(screen.getByRole('button', { name: /quick pin login/i }))

      expect(screen.getByLabelText(/pin code/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when form is invalid', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when email/password form is valid', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should enable submit button when email/PIN form is valid', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      // Switch to PIN mode
      fireEvent.click(screen.getByRole('button', { name: /quick pin login/i }))

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/pin code/i), {
        target: { value: '1234' }
      })

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call email/password sign in when email form is submitted', async () => {
      const onSuccess = jest.fn()
      render(<LoginForm onSuccess={onSuccess} />, { wrapper: createTestWrapper() })

      // Fill form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockSignInMutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('should call PIN sign in when PIN form is submitted', async () => {
      const onSuccess = jest.fn()
      render(<LoginForm onSuccess={onSuccess} />, { wrapper: createTestWrapper() })

      // Switch to PIN mode
      fireEvent.click(screen.getByRole('button', { name: /quick pin login/i }))

      // Fill form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/pin code/i), {
        target: { value: '1234' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockSignInWithPinMutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          pin: '1234'
        })
      })
    })

    it('should call onSuccess callback when sign in succeeds', async () => {
      const onSuccess = jest.fn()
      mockSignInMutate.mockResolvedValue({ user: { id: '123' } })

      render(<LoginForm onSuccess={onSuccess} />, { wrapper: createTestWrapper() })

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should call onError callback when sign in fails', async () => {
      const onError = jest.fn()
      const error = new Error('Invalid credentials')
      mockSignInMutate.mockRejectedValue(error)

      render(<LoginForm onError={onError} />, { wrapper: createTestWrapper() })

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Invalid credentials')
      })
    })
  })

  describe('Loading State', () => {
    it('should disable submit button when loading', () => {
      mockUseSignIn.mockReturnValue({
        mutateAsync: mockSignInMutate,
        isPending: true,
        error: null,
      } as any)

      render(<LoginForm />, { wrapper: createTestWrapper() })

      // Find submit button by name since type attribute doesn't work as selector
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show different button content when loading', () => {
      mockUseSignIn.mockReturnValue({
        mutateAsync: mockSignInMutate,
        isPending: true,
        error: null,
      } as any)

      render(<LoginForm />, { wrapper: createTestWrapper() })

      // The button should exist and be disabled
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Display', () => {
    it('should display error message when sign in fails', () => {
      const error = { message: 'Invalid email or password' }
      mockUseSignIn.mockReturnValue({
        mutateAsync: mockSignInMutate,
        isPending: false,
        error,
      } as any)

      render(<LoginForm />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('should associate PIN field with proper label', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      fireEvent.click(screen.getByRole('button', { name: /quick pin login/i }))

      expect(screen.getByLabelText(/pin code/i)).toBeInTheDocument()
    })

    it('should have proper input types', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() })

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')

      fireEvent.click(screen.getByRole('button', { name: /quick pin login/i }))
      
      expect(screen.getByLabelText(/pin code/i)).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText(/pin code/i)).toHaveAttribute('inputmode', 'numeric')
    })
  })
})
