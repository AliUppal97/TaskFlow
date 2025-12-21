'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, RegisterRequest } from '@/types/api';
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

// Check if mock auth mode is enabled
const isMockAuthEnabled = () => {
  if (typeof window === 'undefined') return false;
  // Check environment variable first, then localStorage
  const envMock = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
  const storageMock = localStorage.getItem('mockAuth') === 'true';
  return envMock || storageMock;
};

// Create a mock user for development
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

  const checkAuthStatus = async () => {
    // If mock auth is enabled, use mock user
    if (isMockAuthEnabled()) {
      const mockUser = createMockUser();
      setUser(mockUser);
      // Set a mock token so other parts of the app work
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
        return;
      }

      // Try to get user profile to verify token validity
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch {
      // If backend is not available and we're in development, optionally enable mock auth
      if (process.env.NODE_ENV === 'development') {
        // Check if user wants to enable mock auth automatically
        const autoMock = localStorage.getItem('autoMockAuth') === 'true';
        if (autoMock) {
          const mockUser = createMockUser();
          setUser(mockUser);
          localStorage.setItem('accessToken', 'mock-token');
          localStorage.setItem('mockAuth', 'true');
        }
      } else {
        // Token is invalid, clear it
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



