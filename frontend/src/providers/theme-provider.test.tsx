import { renderHook, act, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme-provider';
import { Theme } from '@/types';

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

// Mock matchMedia
const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)' ? false : false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
});

// Mock document methods
Object.defineProperty(document, 'documentElement', {
  value: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn().mockReturnValue(false),
    },
  },
  writable: true,
});

// Mock offsetHeight to avoid issues
Object.defineProperty(document.documentElement, 'offsetHeight', {
  value: 100,
  writable: true,
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    document.documentElement.classList.add.mockClear();
    document.documentElement.classList.remove.mockClear();
    document.documentElement.classList.contains.mockClear();
    mockMatchMedia.mockClear();

    // Reset classList mocks
    document.documentElement.classList.contains.mockReturnValue(false);
  });

  const wrapper = ({ children, defaultTheme }: { children: React.ReactNode; defaultTheme?: Theme }) => (
    <ThemeProvider defaultTheme={defaultTheme}>{children}</ThemeProvider>
  );

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('initialization', () => {
    it('should initialize with stored theme when valid', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.theme).toBe(Theme.LIGHT);
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should initialize with dark theme when stored theme is invalid', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.theme).toBe(Theme.DARK);
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should initialize with default theme when no stored theme', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.theme).toBe(Theme.DARK);
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should respect defaultTheme prop', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children, defaultTheme: Theme.LIGHT }),
      });

      expect(result.current.theme).toBe(Theme.LIGHT);
      expect(result.current.resolvedTheme).toBe('light');
    });
  });

  describe('theme resolution', () => {
    it('should resolve light theme correctly', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should resolve dark theme correctly', () => {
      localStorageMock.getItem.mockReturnValue(Theme.DARK);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should resolve system theme to light when system prefers light', () => {
      localStorageMock.getItem.mockReturnValue(Theme.SYSTEM);
      mockMatchMedia.mockReturnValue({
        matches: false, // prefers light
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should resolve system theme to dark when system prefers dark', () => {
      localStorageMock.getItem.mockReturnValue(Theme.SYSTEM);
      mockMatchMedia.mockReturnValue({
        matches: true, // prefers dark
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('should update theme and store in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(Theme.DARK);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      act(() => {
        result.current.setTheme(Theme.LIGHT);
      });

      expect(result.current.theme).toBe(Theme.LIGHT);
      expect(result.current.resolvedTheme).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', Theme.LIGHT);
    });

    it('should apply dark class to DOM when setting dark theme', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      act(() => {
        result.current.setTheme(Theme.DARK);
      });

      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should remove dark class from DOM when setting light theme', () => {
      localStorageMock.getItem.mockReturnValue(Theme.DARK);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      act(() => {
        result.current.setTheme(Theme.LIGHT);
      });

      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light');
      // Should remove dark class multiple times for light theme
      expect(document.documentElement.classList.remove).toHaveBeenCalledTimes(6); // called multiple times
    });

    it('should handle system theme changes', () => {
      localStorageMock.getItem.mockReturnValue(Theme.DARK);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      mockMatchMedia.mockReturnValue({
        matches: false, // prefers light
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      act(() => {
        result.current.setTheme(Theme.SYSTEM);
      });

      expect(result.current.theme).toBe(Theme.SYSTEM);
      expect(result.current.resolvedTheme).toBe('light');
    });
  });

  describe('DOM manipulation', () => {
    it('should apply theme to DOM on mount', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      // Should remove dark class for light theme
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should handle theme changes in DOM', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      // Simulate DOM having dark class when it shouldn't
      document.documentElement.classList.contains.mockReturnValue(true);

      // Trigger a DOM change (this would normally happen via MutationObserver)
      act(() => {
        // The enforcement logic should trigger
        setTimeout(() => {}, 0);
      });
    });
  });

  describe('system theme listening', () => {
    it('should listen for system theme changes when theme is SYSTEM', () => {
      localStorageMock.getItem.mockReturnValue(Theme.SYSTEM);
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should not listen for system theme changes when theme is not SYSTEM', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    it('should update DOM when system theme changes', () => {
      localStorageMock.getItem.mockReturnValue(Theme.SYSTEM);
      const mockMediaQuery = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);

      renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      // Simulate system theme change
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      mockMediaQuery.matches = true; // Now prefers dark

      act(() => {
        changeHandler();
      });

      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });
  });

  describe('SSR safety', () => {
    it('should handle server-side rendering', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        renderHook(() => useTheme(), {
          wrapper: ({ children }) => wrapper({ children }),
        });
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      expect(() => {
        renderHook(() => useTheme(), {
          wrapper: ({ children }) => wrapper({ children }),
        });
      }).not.toThrow();
    });

    it('should handle DOM manipulation errors gracefully', () => {
      document.documentElement.classList.add.mockImplementation(() => {
        throw new Error('DOM manipulation failed');
      });

      localStorageMock.getItem.mockReturnValue(Theme.DARK);

      expect(() => {
        renderHook(() => useTheme(), {
          wrapper: ({ children }) => wrapper({ children }),
        });
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid theme changes', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      act(() => {
        result.current.setTheme(Theme.DARK);
        result.current.setTheme(Theme.LIGHT);
        result.current.setTheme(Theme.SYSTEM);
      });

      expect(result.current.theme).toBe(Theme.SYSTEM);
    });

    it('should handle invalid theme values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme' as any);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.theme).toBe(Theme.DARK); // Should fallback to dark
    });

    it('should handle all valid theme transitions', () => {
      localStorageMock.getItem.mockReturnValue(Theme.LIGHT);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      const themes = [Theme.DARK, Theme.SYSTEM, Theme.LIGHT, Theme.DARK];

      themes.forEach((theme) => {
        act(() => {
          result.current.setTheme(theme);
        });
        expect(result.current.theme).toBe(theme);
      });
    });
  });
});

