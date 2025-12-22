import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from './auth-provider';
import { apiClient } from '@/lib/api-client';
import { User, UserRole } from '@/types';

// Mock next/navigation
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

// Mock API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthProvider', () => {
  let queryClient: QueryClient;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.USER,
    profile: { firstName: 'Test', lastName: 'User' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    localStorageMock.clear();
    mockPush.mockClear();
    mockGet.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('initialization', () => {
    it('should initialize with no user when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load user profile when valid token exists', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(apiClient.getProfile).toHaveBeenCalled();
    });

    it('should clear invalid token on profile fetch failure', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'invalid-token';
        return null;
      });

      (apiClient.getProfile as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (apiClient.login as jest.Mock).mockResolvedValue({
        accessToken: 'new-token',
      });
      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(apiClient.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle login failure', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const error = new Error('Invalid credentials');
      (apiClient.login as jest.Mock).mockRejectedValue(error);

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'wrong-password')
        ).rejects.toThrow(error);
      });

      expect(result.current.user).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (apiClient.register as jest.Mock).mockResolvedValue({ data: mockUser });

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
          profile: { firstName: 'New', lastName: 'User' },
        });
      });

      expect(apiClient.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        profile: { firstName: 'New', lastName: 'User' },
      });
      expect(mockPush).toHaveBeenCalledWith('/login?message=Registration successful, please login');
    });

    it('should handle registration failure', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const error = new Error('Email already exists');
      (apiClient.register as jest.Mock).mockRejectedValue(error);

      await act(async () => {
        await expect(
          result.current.register({
            email: 'existing@example.com',
            password: 'password123',
          })
        ).rejects.toThrow(error);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      (apiClient.logout as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.logout();
      });

      expect(apiClient.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should logout even if API call fails', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);
      (apiClient.logout as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('refreshProfile', () => {
    it('should refresh user profile successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = { ...mockUser, profile: { firstName: 'Updated' } };
      (apiClient.getProfile as jest.Mock).mockResolvedValue(updatedUser);

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(apiClient.getProfile).toHaveBeenCalled();
      expect(result.current.user).toEqual(updatedUser);
    });

    it('should clear user on profile refresh failure', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'expired-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (apiClient.getProfile as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent login attempts', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (apiClient.login as jest.Mock).mockResolvedValue({
        accessToken: 'new-token',
      });
      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);

      // Simulate concurrent logins
      await act(async () => {
        await Promise.all([
          result.current.login('test@example.com', 'password123'),
          result.current.login('test@example.com', 'password123'),
        ]);
      });

      expect(apiClient.login).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid logout/login sequence', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);
      (apiClient.logout as jest.Mock).mockResolvedValue(undefined);
      (apiClient.login as jest.Mock).mockResolvedValue({
        accessToken: 'new-token',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (apiClient.login as jest.Mock).mockResolvedValue({
        accessToken: 'new-token',
      });
      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);

      // Should still work even if localStorage fails
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle network timeout during login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };
      (apiClient.login as jest.Mock).mockRejectedValue(timeoutError);

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'password123')
        ).rejects.toEqual(timeoutError);
      });

      expect(result.current.user).toBeNull();
    });

    it('should handle malformed user profile response', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      (apiClient.getProfile as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle null profile gracefully
      expect(result.current.user).toBeNull();
    });

    it('should preserve user state during profile refresh', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      (apiClient.getProfile as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const updatedUser = { ...mockUser, profile: { firstName: 'Updated' } };
      (apiClient.getProfile as jest.Mock).mockResolvedValue(updatedUser);

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(result.current.user).toEqual(updatedUser);
    });
  });
});

