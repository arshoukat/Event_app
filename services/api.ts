// Configure your API URL in .env file or set it here
// For external APIs, set EXPO_PUBLIC_API_URL in your .env file
import { storageService } from './storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the local IP address for development (Android/iOS physical devices)
const getLocalIP = (): string | null => {
  try {
    console.log('[API] Attempting to detect local IP...');
    console.log('[API] Constants.expoConfig?.hostUri:', Constants.expoConfig?.hostUri);
    console.log('[API] Constants.manifest2:', Constants.manifest2 ? 'exists' : 'null');
    console.log('[API] Constants.manifest:', Constants.manifest ? 'exists' : 'null');
    
    // Method 1: Try Constants.manifest.debuggerHost (most reliable for Expo Go)
    if (Constants.manifest?.debuggerHost) {
      const ip = Constants.manifest.debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log(`[API] ✓ Detected IP from manifest.debuggerHost: ${ip}`);
        return ip;
      }
    }

    // Method 2: Try expoConfig.hostUri (available when connected via QR code)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log(`[API] ✓ Detected IP from hostUri: ${ip}`);
        return ip;
      }
    }

    // Method 3: Try Constants.manifest2 (newer Expo SDK)
    if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
      const ip = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log(`[API] ✓ Detected IP from manifest2: ${ip}`);
        return ip;
      }
    }

    // Method 4: Try Constants.manifest.hostUri (alternative)
    if (Constants.manifest?.hostUri) {
      const ip = Constants.manifest.hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log(`[API] ✓ Detected IP from manifest.hostUri: ${ip}`);
        return ip;
      }
    }
    
    console.warn('[API] ✗ Could not detect local IP automatically');
  } catch (error) {
    console.warn('[API] Error detecting local IP:', error);
  }
  
  return null;
};

// Determine the API URL dynamically
// Priority: 1. Environment variable, 2. Local network IP for devices, 3. localhost fallback
const getAPIURL = (): string => {
  // If EXPO_PUBLIC_API_URL is set, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log(`[API] Using EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL}`);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // For physical devices (Android/iOS), try to use the local network IP
  if (Platform.OS !== 'web') {
    const localIP = getLocalIP();
    if (localIP) {
      const apiUrl = `http://${localIP}:5001/api`;
      console.log(`[API] Using detected IP: ${apiUrl}`);
      return apiUrl;
    } else {
      console.error('[API] ⚠️ Could not detect local IP automatically!');
      console.error('[API] ⚠️ This will NOT work on Android/iOS devices via QR code.');
      console.error('[API] 📝 Solution: Create a .env file in the project root with:');
      console.error('[API] 📝 EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5001/api');
      console.error('[API] 📝 Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)');
      console.error('[API] 📝 Then restart Expo server with: npm start');
    }
  }

  // For web or fallback, use localhost
  const apiUrl = 'http://localhost:5001/api';
  console.log(`[API] Using default: ${apiUrl}`);
  return apiUrl;
};

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable if set, otherwise use dynamic detection
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || getAPIURL();
  }

  private getBaseUrl(): string {
    // Dynamically get the API URL (in case hostUri wasn't available at module load)
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    return getAPIURL();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    console.log(`[API] Request URL: ${url}`);
    
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
      console.log(`[API] Making ${options.method || 'GET'} request to: ${url}`);
      console.log(`[API] Request headers:`, config.headers);
      
      const response = await fetch(url, config);
      
      console.log(`[API] Response status: ${response.status} ${response.statusText}`);
      console.log(`[API] Response content-type:`, response.headers.get('content-type'));
      
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

