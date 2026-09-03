/**
 * API Service - Axios with Interceptors
 * Handles authentication, error handling, retry logic, and offline queuing
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { storePendingAction, syncOfflineActions as replayOfflineQueue } from './databaseService';

const API_BASE_URL = 'https://api.entx.app/api/v2';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data: T;
  meta?: {
    timestamp: string;
    version: string;
  };
  error?: string;
}

interface FailedRequest {
  config: any;
  resolve: any;
  reject: any;
}

let retryCount = 0;
let failedQueue: FailedRequest[] = [];
let isRefreshing = false;

/**
 * Create API client with interceptors
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      } catch (error) {
        console.error('[API] Request interceptor error:', error);
        return config;
      }
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse>) => {
      const originalConfig = error.config as any;

      // Handle 401 (token expired)
      if (error.response?.status === 401 && !originalConfig._retry) {
        if (isRefreshing) {
          // Queue the request while token is being refreshed
          return new Promise((resolve, reject) => {
            failedQueue.push({ config: originalConfig, resolve, reject });
          });
        }

        originalConfig._retry = true;
        isRefreshing = true;
        retryCount = 0;

        try {
          const authStore = useAuthStore.getState();
          await authStore.refreshAccessToken();

          // Retry queued requests
          failedQueue.forEach(({ config, resolve }) => {
            client(config).then(resolve).catch((err) => {
              // If retry also failed, queue for offline sync
              queueOfflineAction('retry_request', '', { config: originalConfig });
            });
          });
          failedQueue = [];

          // Retry the original request
          return client(originalConfig);
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          // Clear auth and redirect to login
          useAuthStore.getState().logout();
          failedQueue = [];
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle 429 (rate limited)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || '60';
        console.warn(`[API] Rate limited. Retry after ${retryAfter}s`);
        return Promise.reject(error);
      }

      // Handle 500+ (server errors) - retry with exponential backoff
      if (
        error.response?.status &&
        error.response.status >= 500 &&
        retryCount < MAX_RETRIES
      ) {
        retryCount++;
        const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
        console.warn(`[API] Server error. Retry ${retryCount}/${MAX_RETRIES} after ${delay}ms`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return client(originalConfig);
      }

      // Handle network errors - queue for offline sync
      if (!error.response && error.message === 'Network Error') {
        console.warn('[API] Network error. Queuing for offline sync.');
        if (originalConfig.method !== 'get') {
          await queueOfflineAction(
            originalConfig.method?.toUpperCase(),
            originalConfig.url,
            originalConfig.data
          );
        }
        return Promise.reject(error);
      }

      // Log error details
      console.error('[API] Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      return Promise.reject(error);
    }
  );

  return client;
};

// Create default client
export const apiClient = createApiClient();

/**
 * Queue offline action for retry when online
 */
const queueOfflineAction = async (
  method: string,
  url: string,
  data: any
): Promise<void> => {
  try {
    const actionId = `${method}_${url}_${Date.now()}`;
    await storePendingAction(method, url, { data });
    console.log('[API] Queued offline action:', actionId);
  } catch (error) {
    console.error('[API] Queue offline action error:', error);
  }
};

/**
 * Sync offline actions when online
 */
export const syncOfflineActions = async (): Promise<void> => {
  try {
    const result = await replayOfflineQueue(async (url, data) => {
      return apiClient.post(url, data);
    });
    console.log(`[API] Offline sync complete: ${result.synced} synced, ${result.failed} failed`);
  } catch (error) {
    console.error('[API] Sync offline actions error:', error);
  }
};

/**
 * Get - fetch data
 */
export const get = async <T = any>(
  url: string,
  config?: any
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.get<ApiResponse<T>>(url, config);
};

/**
 * Post - create data
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: any
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.post<ApiResponse<T>>(url, data, config);
};

/**
 * Put - update data
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: any
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.put<ApiResponse<T>>(url, data, config);
};

/**
 * Delete - remove data
 */
export const del = async <T = any>(
  url: string,
  config?: any
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.delete<ApiResponse<T>>(url, config);
};

export default apiClient;
