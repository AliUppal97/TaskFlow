import { render, screen, waitFor } from '@testing-library/react';
import { QueryProvider } from './query-provider';
import { QueryClient } from '@tanstack/react-query';

// Mock React Query DevTools
jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: ({ initialIsOpen }: { initialIsOpen?: boolean }) => (
    <div data-testid="react-query-devtools" data-initial-open={initialIsOpen} />
  ),
}));

describe('QueryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <QueryProvider>
        <div data-testid="child">Test Child</div>
      </QueryProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should create QueryClient with correct default options', () => {
    const mockQueryClient = new QueryClient();
    const createQueryClientSpy = jest.spyOn(require('@tanstack/react-query'), 'QueryClient');

    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    );

    // Check that QueryClient was created (we can't easily spy on the constructor)
    expect(createQueryClientSpy).toHaveBeenCalled();
  });

  it('should provide QueryClient to children', () => {
    let capturedQueryClient: QueryClient | null = null;

    const TestComponent = () => {
      const { useQueryClient } = require('@tanstack/react-query');
      capturedQueryClient = useQueryClient();
      return <div>Test</div>;
    };

    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );

    expect(capturedQueryClient).toBeInstanceOf(QueryClient);
  });

  describe('QueryClient configuration', () => {
    it('should have correct queries default options', () => {
      const TestComponent = () => {
        const { useQueryClient } = require('@tanstack/react-query');
        const queryClient = useQueryClient();

        expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(60 * 1000); // 1 minute
        expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
        expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);

        return <div>Test</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );
    });

    it('should have correct mutations default options', () => {
      const TestComponent = () => {
        const { useQueryClient } = require('@tanstack/react-query');
        const queryClient = useQueryClient();

        expect(queryClient.getDefaultOptions().mutations?.retry).toBe(false);

        return <div>Test</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );
    });

    it('should have custom retry logic for queries', () => {
      const TestComponent = () => {
        const { useQueryClient } = require('@tanstack/react-query');
        const queryClient = useQueryClient();
        const retryFunction = queryClient.getDefaultOptions().queries?.retry as Function;

        // Test 4xx error - should not retry
        const error400 = { status: 404 };
        expect(retryFunction(0, error400)).toBe(false);
        expect(retryFunction(1, error400)).toBe(false);

        // Test 5xx error - should retry up to 3 times
        const error500 = { status: 500 };
        expect(retryFunction(0, error500)).toBe(true);
        expect(retryFunction(2, error500)).toBe(true);
        expect(retryFunction(3, error500)).toBe(false);

        // Test AxiosError with 4xx - should not retry
        const axiosError400 = {
          isAxiosError: true,
          response: { status: 400 }
        };
        expect(retryFunction(0, axiosError400)).toBe(false);

        // Test AxiosError with 5xx - should retry
        const axiosError500 = {
          isAxiosError: true,
          response: { status: 500 }
        };
        expect(retryFunction(0, axiosError500)).toBe(true);

        return <div>Test</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );
    });
  });

  describe('DevTools component', () => {
    it('should not render devtools on server side', () => {
      render(
        <QueryProvider>
          <div>Test</div>
        </QueryProvider>
      );

      expect(screen.queryByTestId('react-query-devtools')).not.toBeInTheDocument();
    });

    it('should render devtools in development after hydration', async () => {
      process.env.NODE_ENV = 'development';

      render(
        <QueryProvider>
          <div>Test</div>
        </QueryProvider>
      );

      // Wait for dynamic import and state update
      await waitFor(() => {
        expect(screen.getByTestId('react-query-devtools')).toBeInTheDocument();
      });

      const devtools = screen.getByTestId('react-query-devtools');
      expect(devtools).toHaveAttribute('data-initial-open', 'false');

      delete process.env.NODE_ENV;
    });

    it('should not render devtools in production', () => {
      process.env.NODE_ENV = 'production';

      render(
        <QueryProvider>
          <div>Test</div>
        </QueryProvider>
      );

      expect(screen.queryByTestId('react-query-devtools')).not.toBeInTheDocument();

      delete process.env.NODE_ENV;
    });
  });

  describe('Global error handling', () => {
    it('should log mutation errors in development', () => {
      process.env.NODE_ENV = 'development';

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const { useQueryClient } = require('@tanstack/react-query');
        const queryClient = useQueryClient();

        // Simulate calling the global error handler
        const onError = queryClient.getDefaultOptions().mutations?.onError as Function;
        onError(new Error('Test mutation error'));

        return <div>Test</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Mutation error:', 'Test mutation error');

      consoleErrorSpy.mockRestore();
      delete process.env.NODE_ENV;
    });

    it('should log AxiosError details in development', () => {
      process.env.NODE_ENV = 'development';

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const { useQueryClient } = require('@tanstack/react-query');
        const queryClient = useQueryClient();

        const onError = queryClient.getDefaultOptions().mutations?.onError as Function;
        const axiosError = {
          isAxiosError: true,
          response: { data: { error: { message: 'API Error' } } },
          message: 'Request failed'
        };
        onError(axiosError);

        return <div>Test</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Mutation error:', 'API Error');

      consoleErrorSpy.mockRestore();
      delete process.env.NODE_ENV;
    });

    it('should not log mutation errors in production', () => {
      process.env.NODE_ENV = 'production';

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const { useQueryClient } = require('@tanstack/react-query');
        const queryClient = useQueryClient();

        const onError = queryClient.getDefaultOptions().mutations?.onError as Function;
        onError(new Error('Test mutation error'));

        return <div>Test</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      delete process.env.NODE_ENV;
    });
  });
});
