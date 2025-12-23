import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './use-local-storage';

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

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('should return initial value when no stored value exists', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));

    expect(result.current[0]).toBe('default-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return stored value when it exists', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));

    expect(result.current[0]).toBe('stored-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should handle complex objects', () => {
    const complexObject = { id: 1, name: 'test', nested: { value: true } };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));

    const { result } = renderHook(() => useLocalStorage('complex-key', {}));

    expect(result.current[0]).toEqual(complexObject);
  });

  it('should handle arrays', () => {
    const array = [1, 2, 3, { test: 'value' }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(array));

    const { result } = renderHook(() => useLocalStorage('array-key', []));

    expect(result.current[0]).toEqual(array);
  });

  it('should set new value and store it in localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
  });

  it('should handle functional updates', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(5));

    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(6);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', JSON.stringify(6));
  });

  it('should handle null and undefined values', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('nullable-key', 'default'));

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('nullable-key', JSON.stringify(null));

    act(() => {
      result.current[1](undefined);
    });

    expect(result.current[0]).toBeUndefined();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('nullable-key', JSON.stringify(undefined));
  });

  it('should handle JSON parse errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json{');

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('invalid-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error reading localStorage key "invalid-key"'),
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle localStorage setItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('quota-key', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    // Value should still update in state even if localStorage fails
    expect(result.current[0]).toBe('new-value');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error setting localStorage key "quota-key"'),
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle server-side rendering (no window)', () => {
    // Temporarily remove window
    const originalWindow = global.window;
    delete (global as any).window;

    const { result } = renderHook(() => useLocalStorage('ssr-key', 'ssr-default'));

    expect(result.current[0]).toBe('ssr-default');

    // Restore window
    global.window = originalWindow;
  });

  it('should work with different data types', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result: stringResult } = renderHook(() => useLocalStorage('string-key', ''));
    const { result: numberResult } = renderHook(() => useLocalStorage('number-key', 0));
    const { result: booleanResult } = renderHook(() => useLocalStorage('boolean-key', false));
    const { result: objectResult } = renderHook(() => useLocalStorage('object-key', {}));

    expect(stringResult.current[0]).toBe('');
    expect(numberResult.current[0]).toBe(0);
    expect(booleanResult.current[0]).toBe(false);
    expect(objectResult.current[0]).toEqual({});
  });

  it('should handle empty string keys', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('empty-key-value'));

    const { result } = renderHook(() => useLocalStorage('', 'default'));

    expect(result.current[0]).toBe('empty-key-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('');
  });
});

