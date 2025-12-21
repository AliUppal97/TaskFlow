/**
 * Utility functions for enabling/disabling mock authentication mode.
 * This allows you to work on the frontend without running the backend.
 * 
 * Usage:
 * 1. Enable mock auth: enableMockAuth()
 * 2. Disable mock auth: disableMockAuth()
 * 3. Check if enabled: isMockAuthEnabled()
 * 
 * You can also set it via environment variable:
 * NEXT_PUBLIC_MOCK_AUTH=true
 */

import { MockAuthGlobal } from '@/types/common/window.types';

/**
 * Enable mock authentication mode
 * This will allow you to access protected pages without the backend running
 */
export function enableMockAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mockAuth', 'true');
  localStorage.setItem('accessToken', 'mock-token');
  // Reload the page to apply changes
  window.location.reload();
}

/**
 * Disable mock authentication mode
 */
export function disableMockAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mockAuth');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('autoMockAuth');
  // Reload the page to apply changes
  window.location.reload();
}

/**
 * Check if mock authentication is enabled
 */
export function isMockAuthEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const envMock = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
  const storageMock = localStorage.getItem('mockAuth') === 'true';
  return envMock || storageMock;
}

/**
 * Enable auto-mock auth when backend is unavailable
 * This will automatically enable mock auth if the backend is not reachable
 */
export function enableAutoMockAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('autoMockAuth', 'true');
}

/**
 * Disable auto-mock auth
 */
export function disableAutoMockAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('autoMockAuth');
}

// Make functions available globally for easy access from browser console
if (typeof window !== 'undefined') {
  const mockAuthGlobal: MockAuthGlobal = {
    enable: enableMockAuth,
    disable: disableMockAuth,
    isEnabled: isMockAuthEnabled,
    enableAuto: enableAutoMockAuth,
    disableAuto: disableAutoMockAuth,
  };
  
  window.mockAuth = mockAuthGlobal;
}

