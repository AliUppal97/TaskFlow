import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
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

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newTokens = await this.refreshToken();
            if (newTokens) {
              // Update stored tokens
              this.setAccessToken(newTokens.accessToken);
              this.setRefreshToken(newTokens.refreshToken);

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
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

  private async refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return null;

      const response = await axios.post(`${this.baseURL}/api/v1/auth/refresh`, {}, {
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return null;
    }
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Refresh token is stored in httpOnly cookie, we can't read it directly
    // The backend will handle it
    return null;
  }

  private setRefreshToken(token: string): void {
    // Refresh token is handled by httpOnly cookie
    // We don't need to store it in localStorage
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    // Refresh token cookie will be cleared by the backend
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', credentials);
    const { accessToken } = response.data;

    this.setAccessToken(accessToken);

    return response.data;
  }

  async register(userData: any) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  }

  async refresh() {
    const response = await this.client.post('/auth/refresh');
    const { accessToken } = response.data;

    this.setAccessToken(accessToken);

    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Task methods
  async getTasks(params?: Record<string, any>) {
    const response = await this.client.get('/tasks', { params });
    return response.data;
  }

  async getTask(id: string) {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: any) {
    const response = await this.client.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(id: string, taskData: any) {
    const response = await this.client.patch(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string) {
    await this.client.delete(`/tasks/${id}`);
  }

  async assignTask(id: string, assigneeId: string | null) {
    const response = await this.client.patch(`/tasks/${id}/assign`, { assigneeId });
    return response.data;
  }

  async getTaskStats() {
    const response = await this.client.get('/tasks/stats');
    return response.data;
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

export default apiClient;



