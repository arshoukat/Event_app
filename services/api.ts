// Configure your API URL in .env file or set it here
// For external APIs, set EXPO_PUBLIC_API_URL in your .env file
import { storageService } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get token from storage
    const token = await storageService.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle empty responses (like 201 Created with no body)
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        // Try to parse error response body
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData: any = null;
        
        try {
          if (isJson) {
            errorData = await response.json();
            // Extract error message from various possible response formats
            errorMessage = errorData.message || 
                          errorData.error || 
                          errorData.msg || 
                          (errorData.data && (errorData.data.message || errorData.data.error)) ||
                          errorMessage;
          } else {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          }
        } catch (parseError) {
          // If we can't parse the error, use the default message
          console.warn('Could not parse error response:', parseError);
        }
        
        // Handle unauthorized - token might be invalid
        // Only clear auth if it's not a login endpoint (to avoid clearing on login failure)
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          await storageService.clearAuth();
        }
        
        // Create error with status and message
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Handle successful responses
      if (isJson) {
        const data = await response.json();
        return data;
      } else {
        // Return empty object for successful responses without JSON body
        return {} as T;
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();

