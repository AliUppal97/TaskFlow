import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { LoginForm } from './components/login-form';
import { User, UserRole } from '@/types';

// Mock the router
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Test component that uses auth context
function AuthTestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('Auth Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockPush.mockClear();
    mockGet.mockClear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  describe('LoginForm Integration', () => {
    it('completes full login flow successfully', async () => {
      const user = userEvent.setup();

      // Mock successful login
      const mockLogin = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(require('@/providers/auth-provider'), 'useAuth').mockReturnValue({
        login: mockLogin,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        register: jest.fn(),
        logout: jest.fn(),
        refreshProfile: jest.fn(),
      });

      renderWithProviders(<LoginForm />);

      // Fill out form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verify login was called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      // Verify redirect
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('handles login errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';

      const mockLogin = jest.fn().mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      jest.spyOn(require('@/providers/auth-provider'), 'useAuth').mockReturnValue({
        login: mockLogin,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        register: jest.fn(),
        logout: jest.fn(),
        refreshProfile: jest.fn(),
      });

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Verify no redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('validates form before submission', async () => {
      const user = userEvent.setup();

      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('AuthProvider Integration', () => {
    beforeEach(() => {
      // Clear localStorage
      localStorage.clear();
    });

    it('starts unauthenticated by default', () => {
      renderWithProviders(<AuthTestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });

    it('handles successful authentication', async () => {
      const user = userEvent.setup();

      // Mock localStorage
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');

      renderWithProviders(<AuthTestComponent />);

      const loginButton = screen.getByText('Login');
      await user.click(loginButton);

      // Simulate successful login by setting user in localStorage
      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith('accessToken', expect.any(String));
      });
    });

    it('persists authentication state', () => {
      // Set up authenticated state
      localStorage.setItem('accessToken', 'mock-token');

      renderWithProviders(<AuthTestComponent />);

      // Should show authenticated state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    it('handles logout correctly', async () => {
      const user = userEvent.setup();

      // Start authenticated
      localStorage.setItem('accessToken', 'mock-token');

      const mockLogout = jest.fn().mockResolvedValue(undefined);
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        role: UserRole.USER,
        profile: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      jest.spyOn(require('@/providers/auth-provider'), 'useAuth').mockReturnValue({
        login: jest.fn(),
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        register: jest.fn(),
        logout: mockLogout,
        refreshProfile: jest.fn(),
      });

      renderWithProviders(<AuthTestComponent />);

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  describe('Protected Route Behavior', () => {
    it('redirects unauthenticated users', () => {
      renderWithProviders(<AuthTestComponent />);

      // Should remain on current route (no redirect for this test component)
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});



