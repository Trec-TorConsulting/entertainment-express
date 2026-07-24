/**
 * Authentication Store - Zustand
 * Handles JWT tokens, user state, and session management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: (token: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isLoading: false,
  error: null,

  initialize: async (token: string) => {
    set({ isLoading: true });
    try {
      await AsyncStorage.setItem('jwt_token', token);
      set({ token, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to initialize auth', isLoading: false });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Call backend to exchange credentials for JWT
      const response = await axios.post(
        'https://api.entertainmentexpress.com/api/v2/auth/login',
        { email, password }
      );

      const { token, refresh_token, user } = response.data.data;

      await AsyncStorage.setItem('jwt_token', token);
      if (refresh_token) {
        await AsyncStorage.setItem('refresh_token', refresh_token);
      }

      set({
        token,
        refreshToken: refresh_token || null,
        user,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('refresh_token');
      set({
        token: null,
        refreshToken: null,
        user: null,
        error: null,
      });
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
    }
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = get().refreshToken || (await AsyncStorage.getItem('refresh_token'));
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        'https://api.entertainmentexpress.com/api/v2/auth/refresh',
        { refresh_token: refreshToken }
      );

      const { token, refresh_token } = response.data.data;

      await AsyncStorage.setItem('jwt_token', token);
      if (refresh_token) {
        await AsyncStorage.setItem('refresh_token', refresh_token);
      }

      set({
        token,
        refreshToken: refresh_token || refreshToken,
      });
    } catch (error) {
      console.error('[AuthStore] Token refresh failed:', error);
      set({ token: null, refreshToken: null, user: null });
      throw error;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
