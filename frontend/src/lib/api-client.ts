import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
  TaskStats,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

/**
 * API Client - Centralized HTTP client for backend communication
 * 
 * Features:
 * - Automatic JWT token injection in requests
 * - Automatic token refresh on 401 errors
 * - Request/response interceptors for auth handling
 * - Type-safe API methods
 * 
 * Architecture:
 * - Singleton pattern (single instance shared across app)
 * - Axios-based with interceptors for cross-cutting concerns
 * - Token storage in localStorage (access token only)
 * - Refresh token handled via HttpOnly cookies (backend)
 */
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`, // API versioning
      timeout: 10000, // 10 second timeout
      withCredentials: true, // Required for HttpOnly cookie (refresh token) to be sent
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configure request/response interceptors
   * 
   * Request interceptor:
   * - Adds JWT access token to Authorization header
   * 
   * Response interceptor:
   * - Handles 401 errors by attempting token refresh
   * - Retries original request with new token
   * - Redirects to login if refresh fails
   */
  private setupInterceptors() {
    /**
     * Request interceptor: Inject JWT token
     * Automatically adds Bearer token to all authenticated requests
     */
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    /**
     * Response interceptor: Handle token refresh
     * 
     * Flow:
     * 1. On 401 error, attempt to refresh access token
     * 2. If refresh succeeds, retry original request with new token
     * 3. If refresh fails, clear tokens and redirect to login
     * 
     * Prevents infinite retry loops with _retry flag
     */
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 (unauthorized) and if not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Prevent infinite retry loop

          try {
            const newTokens = await this.refreshToken();
            if (newTokens) {
              // Update stored access token
              this.setAccessToken(newTokens.accessToken);
              this.setRefreshToken(newTokens.refreshToken);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed: token expired or invalid
            // Clear tokens and redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh access token using refresh token
   * 
   * Security:
   * - Refresh token stored in HttpOnly cookie (not accessible to JavaScript)
   * - Cookie automatically sent with withCredentials: true
   * - Backend validates refresh token and returns new access token
   * 
   * @returns New token pair or null if refresh fails
   */
  private async refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return null;

      // Refresh token is in HttpOnly cookie, sent automatically with withCredentials
      const response = await axios.post(`${this.baseURL}/api/v1/auth/refresh`, {}, {
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
        withCredentials: true, // Required for cookie-based auth
      });

      return response.data;
    } catch (error) {
      return null; // Refresh failed
    }
  }

  /**
   * Get access token from localStorage
   * SSR-safe: Returns null on server-side
   */
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null; // SSR safety
    return localStorage.getItem('accessToken');
  }

  /**
   * Store access token in localStorage
   * SSR-safe: No-op on server-side
   */
  private setAccessToken(token: string): void {
    if (typeof window === 'undefined') return; // SSR safety
    localStorage.setItem('accessToken', token);
  }

  /**
   * Get refresh token (not used - stored in HttpOnly cookie)
   * Refresh token is handled by browser cookies, not accessible to JavaScript
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Refresh token is stored in httpOnly cookie, we can't read it directly
    // The backend will handle it via cookies
    return null;
  }

  /**
   * Set refresh token (not used - handled by HttpOnly cookie)
   * Refresh token is set by backend in HttpOnly cookie for security
   */
  private setRefreshToken(token: string): void {
    // Refresh token is handled by httpOnly cookie
    // We don't need to store it in localStorage (security best practice)
  }

  /**
   * Clear all tokens
   * Called on logout or refresh failure
   */
  private clearTokens(): void {
    if (typeof window === 'undefined') return; // SSR safety
    localStorage.removeItem('accessToken');
    // Refresh token cookie will be cleared by the backend on logout
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    const authData = response.data;
    
    // Backend returns AuthResponse directly (not wrapped in ApiResponse)
    if (authData?.accessToken) {
      this.setAccessToken(authData.accessToken);
    }

    return authData;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    const response = await this.client.post<ApiResponse<User>>('/auth/register', userData);
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  }

  async refresh(): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/refresh');
    const { data } = response.data;
    
    if (data?.accessToken) {
      this.setAccessToken(data.accessToken);
    }

    return data || response.data as unknown as AuthResponse;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User> | User>('/auth/profile');
    // Backend may return user directly or wrapped in ApiResponse
    const data = response.data;
    if (data && typeof data === 'object' && 'data' in data) {
      // Wrapped in ApiResponse format
      return (data as ApiResponse<User>).data as User;
    }
    // Direct user object
    return data as User;
  }

  // Task methods
  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', { params });
    return response.data.data || response.data as unknown as PaginatedResponse<Task>;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.client.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data || response.data as unknown as Task;
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await this.client.post<ApiResponse<Task>>('/tasks', taskData);
    return response.data.data || response.data as unknown as Task;
  }

  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<Task> {
    const response = await this.client.patch<ApiResponse<Task>>(`/tasks/${id}`, taskData);
    return response.data.data || response.data as unknown as Task;
  }

  async deleteTask(id: string) {
    await this.client.delete(`/tasks/${id}`);
  }

  async assignTask(id: string, assigneeId: string | null): Promise<Task> {
    const response = await this.client.patch<ApiResponse<Task>>(`/tasks/${id}/assign`, { assigneeId });
    return response.data.data || response.data as unknown as Task;
  }

  async getTaskStats(): Promise<TaskStats> {
    const response = await this.client.get<ApiResponse<TaskStats>>('/tasks/stats');
    return response.data.data || response.data as unknown as TaskStats;
  }

  // Generic request methods
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

export default apiClient;



