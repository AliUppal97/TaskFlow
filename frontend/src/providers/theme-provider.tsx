'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { Theme } from '@/types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = Theme.DARK }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize theme from localStorage or default to dark
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme | null;
      // Use stored theme if valid, otherwise default to dark
      return (stored && Object.values(Theme).includes(stored)) ? stored : Theme.DARK;
    }
    return defaultTheme;
  });
  const [mounted, setMounted] = useState(false);

  // Derive resolvedTheme from theme and system preference
  const resolvedTheme = useMemo(() => {
    // CRITICAL: If user explicitly selected light or dark, NEVER check system preference
    if (theme === Theme.LIGHT) {
      return 'light';
    }
    if (theme === Theme.DARK) {
      return 'dark';
    }
    // Only check system preference when theme is SYSTEM
    if (theme === Theme.SYSTEM && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    // Fallback to dark
    return 'dark';
  }, [theme]);

  // Apply initial theme to DOM
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Sync with the theme already applied by the inline script in layout
      const root = document.documentElement;
      const resolveTheme = (): 'light' | 'dark' => {
        // CRITICAL: If user explicitly selected light or dark, NEVER check system preference
        if (theme === Theme.LIGHT) {
          return 'light';
        }
        if (theme === Theme.DARK) {
          return 'dark';
        }
        // Only check system preference when theme is SYSTEM
        if (theme === Theme.SYSTEM) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        // Fallback to dark
        return 'dark';
      };
      const resolved = resolveTheme();
      
      // Forcefully apply the correct theme to DOM - MULTIPLE TIMES to ensure it sticks
      // Remove dark class first (critical for light theme)
      root.classList.remove('dark');
      root.classList.remove('light');
      
      // Force a reflow
      void root.offsetHeight;
      
      // Apply theme
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        // CRITICAL: Explicitly remove dark class for light theme - do it multiple times
        root.classList.remove('dark');
        void root.offsetHeight;
        root.classList.remove('dark');
      }
      
      // Double-check after a brief delay
      setTimeout(() => {
        if (resolved === 'light' && root.classList.contains('dark')) {
          root.classList.remove('dark');
          void root.offsetHeight;
          root.classList.remove('dark');
        } else if (resolved === 'dark' && !root.classList.contains('dark')) {
          root.classList.add('dark');
        }
      }, 10);
      
      // Additional check after longer delay
      setTimeout(() => {
        if (resolved === 'light' && root.classList.contains('dark')) {
          root.classList.remove('dark');
        }
      }, 100);
      
      setMounted(true);
    } else {
      // On server, set mounted immediately to provide context
      setMounted(true);
    }
  }, [defaultTheme, theme]);

  // Apply theme to DOM when resolvedTheme changes
  useEffect(() => {
    if (!mounted) return;

    // Apply theme class to document IMMEDIATELY
    // Tailwind uses .dark class for dark mode, no class for light mode
    const root = document.documentElement;

    // CRITICAL: Forcefully remove dark class first - do it multiple times
    root.classList.remove('light', 'dark');
    // Force a reflow to ensure browser processes the removal
    void root.offsetHeight;

    // Only add dark if explicitly dark, otherwise ensure it's removed
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      // CRITICAL: Explicitly ensure dark is removed for light theme
      // Do this multiple times to ensure it sticks
      root.classList.remove('dark');
      // Force another reflow
      void root.offsetHeight;
      root.classList.remove('dark');
      void root.offsetHeight;
      root.classList.remove('dark');
    }

    // Multiple verification checks to ensure theme is applied correctly
    const checkAndFix = () => {
      const hasDark = root.classList.contains('dark');
      if (resolvedTheme === 'light' && hasDark) {
        root.classList.remove('dark');
        // Force reflow after removal
        void root.offsetHeight;
      } else if (resolvedTheme === 'dark' && !hasDark) {
        root.classList.add('dark');
      }
    };

    // Check immediately
    setTimeout(checkAndFix, 0);
    // Check after a brief delay
    const timeoutId1 = setTimeout(checkAndFix, 10);
    // Check after a longer delay to catch any async issues
    const timeoutId2 = setTimeout(checkAndFix, 50);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [resolvedTheme, mounted]);

  // Listen for system theme changes if using system theme
  useEffect(() => {
    if (!mounted || theme !== Theme.SYSTEM) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newResolved = mediaQuery.matches ? 'dark' : 'light';
      const root = document.documentElement;
      // Forcefully remove dark class first
      root.classList.remove('light', 'dark');
      // Only add dark if explicitly dark, otherwise ensure it's removed
      if (newResolved === 'dark') {
        root.classList.add('dark');
      } else {
        // Explicitly ensure dark is removed for light theme
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      // Immediately and forcefully apply theme change - this is critical
      const root = document.documentElement;
      const resolveTheme = (): 'light' | 'dark' => {
        // CRITICAL: If user explicitly selected light or dark, NEVER check system preference
        if (newTheme === Theme.LIGHT) {
          return 'light';
        }
        if (newTheme === Theme.DARK) {
          return 'dark';
        }
        // Only check system preference when theme is SYSTEM
        if (newTheme === Theme.SYSTEM) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        // Fallback to dark
        return 'dark';
      };
      const resolved = resolveTheme();

      // CRITICAL: Forcefully remove dark class first - this must happen before adding
      root.classList.remove('dark');
      root.classList.remove('light');

      // Force a reflow to ensure browser processes the removal
      void root.offsetHeight;

      // Apply the correct theme IMMEDIATELY
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        // For light theme, explicitly ensure dark is removed - CRITICAL
        // Do this multiple times to ensure it sticks
        root.classList.remove('dark');
        void root.offsetHeight;
        root.classList.remove('dark');
        void root.offsetHeight;
        root.classList.remove('dark');
      }

      // Force another synchronous reflow to ensure browser applies styles immediately
      void root.offsetHeight;

      // Multiple checks to ensure theme is applied correctly
      const checkAndFix = () => {
        const currentResolved = resolveTheme();
        const hasDark = root.classList.contains('dark');
        // Ensure light theme is always enforced when selected
        if (currentResolved === 'light' && hasDark) {
          root.classList.remove('dark');
          void root.offsetHeight;
          root.classList.remove('dark');
        } else if (currentResolved === 'dark' && !hasDark) {
          root.classList.add('dark');
        }
      };

      // Check 1: After a microtask
      setTimeout(checkAndFix, 0);
      // Check 2: After a slightly longer delay
      setTimeout(checkAndFix, 10);
      // Check 3: After a longer delay to catch any async issues
      setTimeout(checkAndFix, 50);
      // Check 4: Final check after 100ms
      setTimeout(checkAndFix, 100);
      // Check 5: Extra check after 200ms for stubborn cases
      setTimeout(checkAndFix, 200);
    }
  };

  // Watch for any external changes to the dark class and sync state
  // CRITICAL: Only enforce theme when user has explicitly selected light/dark (not system)
  useEffect(() => {
    if (!mounted) return;
    
    // Only enforce theme changes if user has explicitly selected light or dark
    // For system theme, let the system preference listener handle it
    if (theme === Theme.SYSTEM) return;

    // Aggressive enforcement: Check and fix theme periodically
    const enforceTheme = () => {
      const root = document.documentElement;
      const hasDark = root.classList.contains('dark');
      const expectedDark = resolvedTheme === 'dark';
      
      // If there's a mismatch, fix it immediately
      // This ensures light theme is ALWAYS enforced when selected
      if (hasDark !== expectedDark) {
        if (expectedDark) {
          root.classList.add('dark');
        } else {
          // CRITICAL: Forcefully remove dark class for light theme
          // Do this multiple times to ensure it sticks
          root.classList.remove('dark');
          void root.offsetHeight;
          root.classList.remove('dark');
          void root.offsetHeight;
          root.classList.remove('dark');
        }
      }
    };

    // Immediate check
    enforceTheme();
    // Check again after a brief delay
    setTimeout(enforceTheme, 0);

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      enforceTheme();
      // Also check after a brief delay in case of rapid changes
      setTimeout(enforceTheme, 10);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Periodic check to catch any edge cases (every 100ms for aggressive enforcement)
    const intervalId = setInterval(enforceTheme, 100);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, [mounted, resolvedTheme, theme]);

  // Always provide context, even before mounting to prevent errors
  // The context value will be updated once mounted and theme is resolved
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

