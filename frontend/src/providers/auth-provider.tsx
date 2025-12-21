'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, RegisterRequest } from '@/types';
import { apiClient } from '@/lib/api-client';
// Import mock auth utilities to make them available globally
import '@/utils/mock-auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Check if mock authentication mode is enabled
 * 
 * Mock auth allows frontend development without backend
 * Useful for UI development and testing
 * 
 * Priority:
 * 1. Environment variable (NEXT_PUBLIC_MOCK_AUTH)
 * 2. localStorage flag (mockAuth)
 * 
 * @returns true if mock auth is enabled
 */
const isMockAuthEnabled = () => {
  if (typeof window === 'undefined') return false; // SSR safety
  // Check environment variable first, then localStorage
  const envMock = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
  const storageMock = localStorage.getItem('mockAuth') === 'true';
  return envMock || storageMock;
};

/**
 * Create a mock user for development/testing
 * Used when mock auth is enabled
 */
const createMockUser = (): User => ({
  id: 'mock-user-id',
  email: 'dev@taskflow.com',
  role: UserRole.USER,
  profile: {
    firstName: 'Dev',
    lastName: 'User',
    avatar: undefined,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check authentication status on app load
   * 
   * Flow:
   * 1. Check if mock auth is enabled (development mode)
   * 2. If real auth: Verify token by fetching user profile
   * 3. If token invalid: Clear tokens and set user to null
   * 4. If backend unavailable (dev): Optionally enable mock auth
   */
  const checkAuthStatus = async () => {
    // Mock auth mode: Use mock user for development
    if (isMockAuthEnabled()) {
      const mockUser = createMockUser();
      setUser(mockUser);
      // Set mock token so API client doesn't fail
      if (!localStorage.getItem('accessToken')) {
        localStorage.setItem('accessToken', 'mock-token');
      }
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return; // No token = not authenticated
      }

      // Verify token validity by fetching user profile
      // If token is invalid, API will return 401 and interceptor will handle it
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch {
      // Token invalid or backend unavailable
      if (process.env.NODE_ENV === 'development') {
        // Development: Optionally enable mock auth if backend is down
        const autoMock = localStorage.getItem('autoMockAuth') === 'true';
        if (autoMock) {
          const mockUser = createMockUser();
          setUser(mockUser);
          localStorage.setItem('accessToken', 'mock-token');
          localStorage.setItem('mockAuth', 'true');
        }
      } else {
        // Production: Clear invalid token
        localStorage.removeItem('accessToken');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // If mock auth is enabled, simulate login
    if (isMockAuthEnabled()) {
      const mockUser = createMockUser();
      setUser(mockUser);
      localStorage.setItem('accessToken', 'mock-token');
      router.push('/dashboard');
      return;
    }

    try {
      await apiClient.login({ email, password });
      const profile = await apiClient.getProfile();
      setUser(profile);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    // If mock auth is enabled, simulate registration
    if (isMockAuthEnabled()) {
      // In mock mode, auto-login after registration
      const mockUser = createMockUser();
      setUser(mockUser);
      localStorage.setItem('accessToken', 'mock-token');
      router.push('/dashboard');
      return;
    }

    try {
      await apiClient.register(userData);
      // After registration, user needs to login
      router.push('/login?message=Registration successful, please login');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    // If mock auth is enabled, just clear local state
    if (isMockAuthEnabled()) {
      setUser(null);
      localStorage.removeItem('accessToken');
      router.push('/login');
      return;
    }

    try {
      await apiClient.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      router.push('/login');
    }
  };

  const refreshProfile = async () => {
    // If mock auth is enabled, use mock user
    if (isMockAuthEnabled()) {
      const mockUser = createMockUser();
      setUser(mockUser);
      return;
    }

    try {
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



